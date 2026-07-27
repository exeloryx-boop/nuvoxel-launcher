use uuid::Uuid;

pub fn offline_uuid(username: &str) -> Uuid {
    let hash = md5::compute(format!("OfflinePlayer{username}"));
    let mut bytes: [u8; 16] = hash.into();
    bytes[6] = (bytes[6] & 0x0f) | 0x30;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    Uuid::from_bytes(bytes)
}
