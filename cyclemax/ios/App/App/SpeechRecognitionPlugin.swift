import AVFoundation
import Capacitor
import Foundation
import Speech

/// "Talk instead of type" for Cyclemax. Same JS surface as @capacitor-community/speech-recognition
/// (jsName "SpeechRecognition", events "partialResults" and "listeningState"), implemented in the app
/// because that plugin ships no Swift package. Uses the iOS speech recognizer, on-device when the
/// device supports it. No audio is stored or sent by the app.
@objc(SpeechRecognitionPlugin)
public class SpeechRecognitionPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SpeechRecognitionPlugin"
    public let jsName = "SpeechRecognition"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "available", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isListening", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "checkPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermissions", returnType: CAPPluginReturnPromise),
    ]

    private let audioEngine = AVAudioEngine()
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var task: SFSpeechRecognitionTask?
    private var listening = false

    @objc func available(_ call: CAPPluginCall) {
        let recognizer = SFSpeechRecognizer(locale: Locale(identifier: call.getString("language") ?? "de-DE"))
        call.resolve(["available": recognizer?.isAvailable ?? false])
    }

    @objc func isListening(_ call: CAPPluginCall) {
        call.resolve(["listening": listening])
    }

    @objc override public func checkPermissions(_ call: CAPPluginCall) {
        call.resolve(["speechRecognition": permissionState()])
    }

    @objc override public func requestPermissions(_ call: CAPPluginCall) {
        SFSpeechRecognizer.requestAuthorization { status in
            guard status == .authorized else {
                DispatchQueue.main.async { call.resolve(["speechRecognition": self.permissionState()]) }
                return
            }
            AVAudioSession.sharedInstance().requestRecordPermission { _ in
                DispatchQueue.main.async { call.resolve(["speechRecognition": self.permissionState()]) }
            }
        }
    }

    @objc func start(_ call: CAPPluginCall) {
        guard permissionState() == "granted" else {
            call.reject("Mikrofon oder Spracherkennung nicht erlaubt.")
            return
        }
        let language = call.getString("language") ?? "de-DE"
        let partial = call.getBool("partialResults") ?? true
        guard let recognizer = SFSpeechRecognizer(locale: Locale(identifier: language)), recognizer.isAvailable else {
            call.reject("Spracheingabe ist gerade nicht verfügbar.")
            return
        }
        DispatchQueue.main.async {
            self.finish()
            do {
                let session = AVAudioSession.sharedInstance()
                try session.setCategory(.record, mode: .measurement, options: [.duckOthers])
                try session.setActive(true, options: .notifyOthersOnDeactivation)

                let request = SFSpeechAudioBufferRecognitionRequest()
                request.shouldReportPartialResults = partial
                if recognizer.supportsOnDeviceRecognition {
                    request.requiresOnDeviceRecognition = true
                }
                self.request = request

                let input = self.audioEngine.inputNode
                input.removeTap(onBus: 0)
                input.installTap(onBus: 0, bufferSize: 1024, format: input.outputFormat(forBus: 0)) { buffer, _ in
                    request.append(buffer)
                }
                self.audioEngine.prepare()
                try self.audioEngine.start()
                self.listening = true
                self.notifyListeners("listeningState", data: ["status": "started"])

                var resolved = false
                self.task = recognizer.recognitionTask(with: request) { result, error in
                    DispatchQueue.main.async {
                        if let result = result {
                            let text = result.bestTranscription.formattedString
                            if partial {
                                self.notifyListeners("partialResults", data: ["matches": [text]])
                            } else if result.isFinal && !resolved {
                                resolved = true
                                call.resolve(["matches": [text]])
                            }
                            if result.isFinal { self.finish() }
                        }
                        if error != nil {
                            if !partial && !resolved {
                                resolved = true
                                call.resolve(["matches": []])
                            }
                            self.finish()
                        }
                    }
                }
                // With partial results the transcript arrives as events; the call itself is done.
                if partial { call.resolve() }
            } catch {
                self.finish()
                call.reject("Spracheingabe konnte nicht starten.")
            }
        }
    }

    @objc func stop(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.task?.finish()
            self.finish()
            call.resolve()
        }
    }

    /// Stops audio and recognition; tells the web side once that listening has ended. Main thread only.
    private func finish() {
        if audioEngine.isRunning { audioEngine.stop() }
        audioEngine.inputNode.removeTap(onBus: 0)
        request?.endAudio()
        request = nil
        task = nil
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        if listening {
            listening = false
            notifyListeners("listeningState", data: ["status": "stopped"])
        }
    }

    private func permissionState() -> String {
        let speech = SFSpeechRecognizer.authorizationStatus()
        let mic = AVAudioSession.sharedInstance().recordPermission
        if speech == .denied || speech == .restricted || mic == .denied { return "denied" }
        if speech == .authorized && mic == .granted { return "granted" }
        return "prompt"
    }
}
