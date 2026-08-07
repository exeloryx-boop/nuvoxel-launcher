package net.nuvoxel.client.api;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import net.nuvoxel.client.NuvoxelClient;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Fetches live data from the Nuvoxel launcher API (https://nuvoxel-launcher.onrender.com).
 */
public final class NuvoxelApiClient {

    public static final String BASE_URL = "https://nuvoxel-launcher.onrender.com";
    public static final String CLIENT_JAR_URL = BASE_URL + "/client/mods/nuvoxel-client.jar";
    public static final String WEBSITE_URL = BASE_URL;

    private static final HttpClient HTTP = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(8))
            .build();

    private static final AtomicReference<CachedData> CACHE = new AtomicReference<>(CachedData.empty());

    public record CachedData(
            boolean online,
            String broadcastText,
            String broadcastType,
            boolean broadcastActive,
            String launcherVersion,
            long fetchedAt
    ) {
        static CachedData empty() {
            return new CachedData(false, "", "info", false, "—", 0);
        }
    }

    /** Refresh API data asynchronously. Safe to call from any thread. */
    public static CompletableFuture<CachedData> refreshAsync() {
        return CompletableFuture.supplyAsync(() -> {
            boolean online = false;
            String broadcastText = "";
            String broadcastType = "info";
            boolean broadcastActive = false;
            String launcherVersion = "—";

            try {
                HttpRequest healthReq = HttpRequest.newBuilder()
                        .uri(URI.create(BASE_URL + "/health"))
                        .timeout(Duration.ofSeconds(6))
                        .GET()
                        .build();
                HttpResponse<String> healthRes = HTTP.send(healthReq, HttpResponse.BodyHandlers.ofString());
                if (healthRes.statusCode() == 200) {
                    online = true;
                    JsonObject health = JsonParser.parseString(healthRes.body()).getAsJsonObject();
                    if (health.has("version")) {
                        launcherVersion = health.get("version").getAsString();
                    }
                }
            } catch (Exception e) {
                System.out.println("[Nuvoxel Client] API health check failed: " + e.getMessage());
            }

            try {
                HttpRequest bcReq = HttpRequest.newBuilder()
                        .uri(URI.create(BASE_URL + "/broadcast"))
                        .timeout(Duration.ofSeconds(6))
                        .GET()
                        .build();
                HttpResponse<String> bcRes = HTTP.send(bcReq, HttpResponse.BodyHandlers.ofString());
                if (bcRes.statusCode() == 200) {
                    JsonObject bc = JsonParser.parseString(bcRes.body()).getAsJsonObject();
                    broadcastText = bc.has("text") ? bc.get("text").getAsString() : "";
                    broadcastType = bc.has("type") ? bc.get("type").getAsString() : "info";
                    broadcastActive = bc.has("active") && bc.get("active").getAsBoolean();
                }
            } catch (Exception e) {
                System.out.println("[Nuvoxel Client] API broadcast fetch failed: " + e.getMessage());
            }

            CachedData data = new CachedData(online, broadcastText, broadcastType, broadcastActive,
                    launcherVersion, System.currentTimeMillis());
            CACHE.set(data);
            System.out.println("[Nuvoxel Client] API refreshed — online=" + online);
            return data;
        });
    }

    public static CachedData getCached() {
        CachedData data = CACHE.get();
        if (data.fetchedAt() == 0 || System.currentTimeMillis() - data.fetchedAt() > 60_000) {
            refreshAsync();
        }
        return data;
    }

    public static void prefetch() {
        refreshAsync().thenAccept(d -> {});
    }

    public static String getModVersionLabel() {
        return "v" + NuvoxelClient.VERSION;
    }
}
