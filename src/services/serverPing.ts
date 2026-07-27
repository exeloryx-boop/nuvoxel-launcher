export interface ServerStatus {
  online: boolean;
  players?: number;
  maxPlayers?: number;
  motd?: string;
  version?: string;
}

export async function pingServer(
  address: string,
  port = 25565,
): Promise<ServerStatus> {
  try {
    const host =
      port === 25565 ? address : `${address}:${port}`;
    const res = await fetch(`https://api.mcsrvstat.us/3/${host}`);
    if (!res.ok) throw new Error("ping failed");
    const data = await res.json();
    return {
      online: Boolean(data.online),
      players: data.players?.online ?? 0,
      maxPlayers: data.players?.max ?? 0,
      motd: data.motd?.clean?.[0],
      version: data.version,
    };
  } catch {
    return { online: false };
  }
}

export function parseServerAddress(input: string): {
  address: string;
  port: number;
} {
  const trimmed = input
    .trim()
    .replace(/^minecraft:\/\//i, "")
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "");

  const ipv6 = trimmed.match(/^\[([^\]]+)\](?::(\d+))?$/);
  if (ipv6) {
    return {
      address: `[${ipv6[1]}]`,
      port: Number(ipv6[2]) || 25565,
    };
  }

  const hostPort = trimmed.match(/^([^:]+):(\d+)$/);
  if (hostPort) {
    return { address: hostPort[1].trim(), port: Number(hostPort[2]) };
  }

  return { address: trimmed, port: 25565 };
}

export function isValidServerEndpoint(address: string, port: number): boolean {
  return (
    address.trim().length > 0 &&
    !/\s|\//.test(address) &&
    Number.isInteger(port) &&
    port >= 1 &&
    port <= 65535
  );
}
