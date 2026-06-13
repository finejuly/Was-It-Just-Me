// SignalCore — the native sender's bridge to the tested TypeScript privacy core.
//
// It embeds JavaScriptCore (macOS-bundled), evaluates the bundled core
// (Resources/wijm-core.js, produced by `npm run build:core`), and calls the
// UNCHANGED `WIJM.transformSignal`. Swift writes NO privacy logic: it only
// supplies a CSPRNG (SecRandomCopyBytes) and an opaque id, because JavaScriptCore
// has no Web Crypto. The privacy guarantee is therefore byte-for-byte the same
// code path the TypeScript suite already verifies (jitter+bucketing+coarsening,
// uniform-random point per signal within the geohash cell, six-field record).
//
// Fully offline: no network, no npm, no LLM at run time — JSC evaluates a local
// script and entropy comes from the OS CSPRNG.

import Foundation
import JavaScriptCore

/// The ONLY shape the privacy core emits. Mirrors the TS `SignalRecord` exactly —
/// no raw lat/lng, no identity, no exact timestamp. Decodable from the JS return.
public struct SignalRecord: Codable, Equatable, Sendable {
    public let id: String
    public let cell: String
    public let jittered_lat: Double
    public let jittered_lng: Double
    public let t: Double
    public let source: String

    /// The exact, complete set of keys allowed in a persisted/transmitted record.
    /// Tests assert the JS output carries these and nothing else (no leak path).
    public static let allowedKeys: Set<String> =
        ["id", "cell", "jittered_lat", "jittered_lng", "t", "source"]
}

public enum SignalCoreError: Error {
    case bundleResourceMissing
    case scriptEvaluationFailed(String)
    case bridgeMissing
    case transformFailed(String)
    case decodeFailed(String)
}

/// Loads the bundled privacy core into a JSContext and exposes a Swift-typed
/// `transform`. One instance owns one JSContext; create per use or reuse freely
/// (not thread-safe — confine to one queue, as a menu-bar sender naturally does).
public final class SignalCore {
    private let context: JSContext

    /// - Parameter scriptURL: location of `wijm-core.js`. Defaults to the package
    ///   resource bundle so callers normally pass nothing.
    public init(scriptURL: URL? = nil) throws {
        guard let context = JSContext() else {
            throw SignalCoreError.scriptEvaluationFailed("could not create JSContext")
        }
        self.context = context

        var thrown: String?
        context.exceptionHandler = { _, value in
            thrown = value?.toString() ?? "unknown JS exception"
        }

        let url = try scriptURL ?? Self.defaultScriptURL()
        let source = try String(contentsOf: url, encoding: .utf8)
        context.evaluateScript(source, withSourceURL: url)
        if let thrown { throw SignalCoreError.scriptEvaluationFailed(thrown) }

        guard let wijm = context.objectForKeyedSubscript("WIJM"),
              !wijm.isUndefined,
              let transform = wijm.objectForKeyedSubscript("transformSignal"),
              !transform.isUndefined
        else {
            throw SignalCoreError.bridgeMissing
        }
    }

    /// Resolve the bundled `wijm-core.js`. SwiftPM ships it via `Bundle.module`.
    private static func defaultScriptURL() throws -> URL {
        if let url = Bundle.module.url(forResource: "wijm-core", withExtension: "js") {
            return url
        }
        throw SignalCoreError.bundleResourceMissing
    }

    /// Transform a raw capture into a privacy-safe record by calling the tested
    /// core. The raw lat/lng exist only as arguments here and never survive the
    /// call — exactly as in the web app's send path.
    ///
    /// - Parameter rand01: injectable uniform-[0,1) source. Defaults to the OS
    ///   CSPRNG (SecRandomCopyBytes). Override only for deterministic tests.
    /// - Parameter newId: injectable opaque id. Defaults to a random UUID.
    public func transform(
        lat: Double,
        lng: Double,
        tsMillis: Double,
        source: String,
        rand01: @escaping () -> Double = SignalCore.secureRandom01,
        newId: @escaping () -> String = { UUID().uuidString }
    ) throws -> SignalRecord {
        var thrown: String?
        context.exceptionHandler = { _, value in
            thrown = value?.toString() ?? "unknown JS exception"
        }

        // Expose the Swift-provided randomness/id to JS as callable functions.
        let jsRand: @convention(block) () -> Double = { rand01() }
        let jsNewId: @convention(block) () -> String = { newId() }

        guard let wijm = context.objectForKeyedSubscript("WIJM"),
              let transformFn = wijm.objectForKeyedSubscript("transformSignal")
        else {
            throw SignalCoreError.bridgeMissing
        }

        let result = transformFn.call(withArguments: [
            lat, lng, tsMillis, source,
            unsafeBitCast(jsRand, to: AnyObject.self),
            unsafeBitCast(jsNewId, to: AnyObject.self),
        ])

        if let thrown { throw SignalCoreError.transformFailed(thrown) }
        guard let result, !result.isUndefined, !result.isNull else {
            throw SignalCoreError.transformFailed("transformSignal returned undefined")
        }

        return try decode(result)
    }

    /// Decode the JS object to a typed record AND assert the key set is exactly the
    /// six allowed fields — a leak guard at the boundary, not just a happy-path parse.
    private func decode(_ value: JSValue) throws -> SignalRecord {
        guard let dict = value.toObject() as? [String: Any] else {
            throw SignalCoreError.decodeFailed("not a JS object")
        }
        let keys = Set(dict.keys)
        guard keys == SignalRecord.allowedKeys else {
            throw SignalCoreError.decodeFailed(
                "unexpected record keys: \(keys.sorted()) (raw/identity leak?)")
        }
        let data = try JSONSerialization.data(withJSONObject: dict)
        do {
            return try JSONDecoder().decode(SignalRecord.self, from: data)
        } catch {
            throw SignalCoreError.decodeFailed(String(describing: error))
        }
    }

    /// OS CSPRNG → uniform float in [0,1). Mirrors the core's Web Crypto default
    /// (32-bit value / 2^32) so the randomness quality matches the web path.
    public static func secureRandom01() -> Double {
        var raw: UInt32 = 0
        let status = withUnsafeMutableBytes(of: &raw) { ptr in
            SecRandomCopyBytes(kSecRandomDefault, 4, ptr.baseAddress!)
        }
        if status != errSecSuccess {
            // Extremely unlikely; fall back to arc4random which is also a CSPRNG.
            raw = arc4random()
        }
        return Double(raw) / 4_294_967_296.0
    }
}
