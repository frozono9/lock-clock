import Foundation
import Network

// Bundled web assets are served only on loopback, with a stable origin so the
// wallpaper/font IndexedDB survives relaunches. No internet server is used.
final class LocalServer {
    private let root: URL
    private let listener: NWListener
    private let queue = DispatchQueue(label: "clock.loopback")
    private let port: NWEndpoint.Port = 8787

    init(root: URL) throws {
        self.root = root.standardizedFileURL
        let params = NWParameters.tcp
        params.requiredLocalEndpoint = .hostPort(host: .ipv4(.loopback), port: port)
        listener = try NWListener(using: params)
    }

    func start(completion: @escaping (Result<URL, Error>) -> Void) {
        listener.stateUpdateHandler = { [weak self] state in
            guard let self = self else { return }
            switch state {
            case .ready:
                completion(.success(URL(string: "http://127.0.0.1:\(self.port.rawValue)/")!))
            case .failed(let error): completion(.failure(error))
            default: break
            }
        }
        listener.newConnectionHandler = { [weak self] connection in
            guard let self = self else { connection.cancel(); return }
            connection.start(queue: self.queue)
            self.receive(connection, bytes: Data())
        }
        listener.start(queue: queue)
    }

    private func receive(_ connection: NWConnection, bytes: Data) {
        connection.receive(minimumIncompleteLength: 1, maximumLength: 16384) { [weak self] data, _, ended, error in
            guard let self = self else { connection.cancel(); return }
            var request = bytes
            if let data = data { request.append(data) }
            guard request.count <= 65536, error == nil else { connection.cancel(); return }
            if request.range(of: Data("\r\n\r\n".utf8)) != nil {
                self.respond(connection, request: request)
            } else if ended { connection.cancel() }
            else { self.receive(connection, bytes: request) }
        }
    }

    private func respond(_ connection: NWConnection, request: Data) {
        let line = String(decoding: request, as: UTF8.self).components(separatedBy: "\r\n").first ?? ""
        let parts = line.split(separator: " ")
        guard parts.count >= 2, parts[0] == "GET" else { send(connection, code: "405 Method Not Allowed", body: Data(), mime: "text/plain"); return }
        let rawPath = String(parts[1]).components(separatedBy: "?")[0]
        guard let path = rawPath.removingPercentEncoding else { connection.cancel(); return }
        let file = root.appendingPathComponent(path == "/" ? "index.html" : String(path.dropFirst())).standardizedFileURL
        guard file.path.hasPrefix(root.path + "/"), let data = try? Data(contentsOf: file) else {
            send(connection, code: "404 Not Found", body: Data(), mime: "text/plain"); return
        }
        let mime = ["html":"text/html; charset=utf-8", "js":"text/javascript; charset=utf-8", "css":"text/css; charset=utf-8", "png":"image/png", "jpg":"image/jpeg", "svg":"image/svg+xml", "webmanifest":"application/manifest+json"][file.pathExtension] ?? "application/octet-stream"
        send(connection, code: "200 OK", body: data, mime: mime)
    }

    private func send(_ connection: NWConnection, code: String, body: Data, mime: String) {
        var response = Data("HTTP/1.1 \(code)\r\nContent-Type: \(mime)\r\nContent-Length: \(body.count)\r\nCache-Control: no-store\r\nConnection: close\r\n\r\n".utf8)
        response.append(body)
        connection.send(content: response, completion: .contentProcessed { _ in connection.cancel() })
    }

    deinit { listener.cancel() }
}
