use std::fs;
use std::io::{Read, Write};
use std::path::PathBuf;
use flate2::read::GzDecoder;
use flate2::write::GzEncoder;
use flate2::Compression;

#[derive(Clone, Debug)]
pub enum NbtTag {
    End,
    Byte(i8),
    Short(i16),
    Int(i32),
    Long(i64),
    Float(f32),
    Double(f64),
    ByteArray(Vec<u8>),
    String(String),
    List(u8, Vec<NbtTag>),
    Compound(std::collections::HashMap<String, NbtTag>),
    IntArray(Vec<i32>),
    LongArray(Vec<i64>),
}

fn read_string(cursor: &mut &[u8]) -> Result<String, String> {
    if cursor.len() < 2 {
        return Err("Unexpected EOF reading string length".into());
    }
    let len = u16::from_be_bytes([cursor[0], cursor[1]]) as usize;
    *cursor = &cursor[2..];
    if cursor.len() < len {
        return Err("Unexpected EOF reading string content".into());
    }
    let s = String::from_utf8_lossy(&cursor[..len]).into_owned();
    *cursor = &cursor[len..];
    Ok(s)
}

fn read_tag(tag_type: u8, cursor: &mut &[u8]) -> Result<NbtTag, String> {
    match tag_type {
        0 => Ok(NbtTag::End),
        1 => {
            if cursor.is_empty() { return Err("EOF".into()); }
            let v = cursor[0] as i8;
            *cursor = &cursor[1..];
            Ok(NbtTag::Byte(v))
        }
        2 => {
            if cursor.len() < 2 { return Err("EOF".into()); }
            let v = i16::from_be_bytes([cursor[0], cursor[1]]);
            *cursor = &cursor[2..];
            Ok(NbtTag::Short(v))
        }
        3 => {
            if cursor.len() < 4 { return Err("EOF".into()); }
            let v = i32::from_be_bytes([cursor[0], cursor[1], cursor[2], cursor[3]]);
            *cursor = &cursor[4..];
            Ok(NbtTag::Int(v))
        }
        4 => {
            if cursor.len() < 8 { return Err("EOF".into()); }
            let v = i64::from_be_bytes([cursor[0], cursor[1], cursor[2], cursor[3], cursor[4], cursor[5], cursor[6], cursor[7]]);
            *cursor = &cursor[8..];
            Ok(NbtTag::Long(v))
        }
        5 => {
            if cursor.len() < 4 { return Err("EOF".into()); }
            let v = f32::from_be_bytes([cursor[0], cursor[1], cursor[2], cursor[3]]);
            *cursor = &cursor[4..];
            Ok(NbtTag::Float(v))
        }
        6 => {
            if cursor.len() < 8 { return Err("EOF".into()); }
            let v = f64::from_be_bytes([cursor[0], cursor[1], cursor[2], cursor[3], cursor[4], cursor[5], cursor[6], cursor[7]]);
            *cursor = &cursor[8..];
            Ok(NbtTag::Double(v))
        }
        7 => {
            if cursor.len() < 4 { return Err("EOF".into()); }
            let len = i32::from_be_bytes([cursor[0], cursor[1], cursor[2], cursor[3]]) as usize;
            *cursor = &cursor[4..];
            if cursor.len() < len { return Err("EOF".into()); }
            let v = cursor[..len].to_vec();
            *cursor = &cursor[len..];
            Ok(NbtTag::ByteArray(v))
        }
        8 => {
            let s = read_string(cursor)?;
            Ok(NbtTag::String(s))
        }
        9 => {
            if cursor.len() < 5 { return Err("EOF".into()); }
            let elem_type = cursor[0];
            let len = i32::from_be_bytes([cursor[1], cursor[2], cursor[3], cursor[4]]) as usize;
            *cursor = &cursor[5..];
            let mut elements = Vec::with_capacity(len);
            for _ in 0..len {
                elements.push(read_tag(elem_type, cursor)?);
            }
            Ok(NbtTag::List(elem_type, elements))
        }
        10 => {
            let mut map = std::collections::HashMap::new();
            loop {
                if cursor.is_empty() { return Err("EOF in compound".into()); }
                let t_type = cursor[0];
                *cursor = &cursor[1..];
                if t_type == 0 {
                    break;
                }
                let name = read_string(cursor)?;
                let val = read_tag(t_type, cursor)?;
                map.insert(name, val);
            }
            Ok(NbtTag::Compound(map))
        }
        11 => {
            if cursor.len() < 4 { return Err("EOF".into()); }
            let len = i32::from_be_bytes([cursor[0], cursor[1], cursor[2], cursor[3]]) as usize;
            *cursor = &cursor[4..];
            if cursor.len() < len * 4 { return Err("EOF".into()); }
            let mut v = Vec::with_capacity(len);
            for i in 0..len {
                let start = i * 4;
                v.push(i32::from_be_bytes([cursor[start], cursor[start+1], cursor[start+2], cursor[start+3]]));
            }
            *cursor = &cursor[len*4..];
            Ok(NbtTag::IntArray(v))
        }
        12 => {
            if cursor.len() < 4 { return Err("EOF".into()); }
            let len = i32::from_be_bytes([cursor[0], cursor[1], cursor[2], cursor[3]]) as usize;
            *cursor = &cursor[4..];
            if cursor.len() < len * 8 { return Err("EOF".into()); }
            let mut v = Vec::with_capacity(len);
            for i in 0..len {
                let start = i * 8;
                v.push(i64::from_be_bytes([
                    cursor[start], cursor[start+1], cursor[start+2], cursor[start+3],
                    cursor[start+4], cursor[start+5], cursor[start+6], cursor[start+7]
                ]));
            }
            *cursor = &cursor[len*8..];
            Ok(NbtTag::LongArray(v))
        }
        _ => Err(format!("Unknown tag type: {}", tag_type)),
    }
}

fn write_string(s: &str, buf: &mut Vec<u8>) {
    let bytes = s.as_bytes();
    buf.extend_from_slice(&(bytes.len() as u16).to_be_bytes());
    buf.extend_from_slice(bytes);
}

fn write_tag(tag: &NbtTag, buf: &mut Vec<u8>) {
    match tag {
        NbtTag::End => {}
        NbtTag::Byte(v) => buf.push(*v as u8),
        NbtTag::Short(v) => buf.extend_from_slice(&v.to_be_bytes()),
        NbtTag::Int(v) => buf.extend_from_slice(&v.to_be_bytes()),
        NbtTag::Long(v) => buf.extend_from_slice(&v.to_be_bytes()),
        NbtTag::Float(v) => buf.extend_from_slice(&v.to_be_bytes()),
        NbtTag::Double(v) => buf.extend_from_slice(&v.to_be_bytes()),
        NbtTag::ByteArray(v) => {
            buf.extend_from_slice(&(v.len() as i32).to_be_bytes());
            buf.extend_from_slice(v);
        }
        NbtTag::String(v) => write_string(v, buf),
        NbtTag::List(elem_type, elements) => {
            buf.push(*elem_type);
            buf.extend_from_slice(&(elements.len() as i32).to_be_bytes());
            for elem in elements {
                write_tag(elem, buf);
            }
        }
        NbtTag::Compound(map) => {
            for (name, val) in map {
                let t_type = match val {
                    NbtTag::End => 0,
                    NbtTag::Byte(_) => 1,
                    NbtTag::Short(_) => 2,
                    NbtTag::Int(_) => 3,
                    NbtTag::Long(_) => 4,
                    NbtTag::Float(_) => 5,
                    NbtTag::Double(_) => 6,
                    NbtTag::ByteArray(_) => 7,
                    NbtTag::String(_) => 8,
                    NbtTag::List(_, _) => 9,
                    NbtTag::Compound(_) => 10,
                    NbtTag::IntArray(_) => 11,
                    NbtTag::LongArray(_) => 12,
                };
                buf.push(t_type);
                write_string(name, buf);
                write_tag(val, buf);
            }
            buf.push(0); // TAG_End
        }
        NbtTag::IntArray(v) => {
            buf.extend_from_slice(&(v.len() as i32).to_be_bytes());
            for x in v {
                buf.extend_from_slice(&x.to_be_bytes());
            }
        }
        NbtTag::LongArray(v) => {
            buf.extend_from_slice(&(v.len() as i32).to_be_bytes());
            for x in v {
                buf.extend_from_slice(&x.to_be_bytes());
            }
        }
    }
}

#[tauri::command]
pub fn add_server_to_servers_dat(game_dir: String, name: String, ip: String) -> Result<(), String> {
    let servers_path = PathBuf::from(game_dir).join("servers.dat");
    if let Some(parent) = servers_path.parent() {
        fs::create_dir_all(parent).ok();
    }
    
    let mut root_compound = if servers_path.exists() {
        let file = fs::File::open(&servers_path).map_err(|e| format!("Failed to open servers.dat: {e}"))?;
        let mut decoder = GzDecoder::new(file);
        let mut decompressed = Vec::new();
        if let Err(_e) = decoder.read_to_end(&mut decompressed) {
            // If decompressed fails, start fresh
            let mut map = std::collections::HashMap::new();
            map.insert("servers".to_string(), NbtTag::List(10, Vec::new()));
            map
        } else {
            let mut cursor = &decompressed[..];
            if cursor.is_empty() {
                let mut map = std::collections::HashMap::new();
                map.insert("servers".to_string(), NbtTag::List(10, Vec::new()));
                map
            } else {
                let tag_type = cursor[0];
                cursor = &cursor[1..];
                if tag_type != 10 {
                    return Err(format!("Invalid root tag type: {tag_type}"));
                }
                let _root_name = read_string(&mut cursor)?;
                match read_tag(10, &mut cursor)? {
                    NbtTag::Compound(map) => map,
                    _ => return Err("Root tag is not a compound".to_string()),
                }
            }
        }
    } else {
        let mut map = std::collections::HashMap::new();
        map.insert("servers".to_string(), NbtTag::List(10, Vec::new()));
        map
    };

    let mut servers_list = match root_compound.get_mut("servers") {
        Some(NbtTag::List(10, list)) => std::mem::take(list),
        _ => Vec::new(),
    };

    let mut already_exists = false;
    for server in &servers_list {
        if let NbtTag::Compound(server_map) = server {
            if let Some(NbtTag::String(server_ip)) = server_map.get("ip") {
                if server_ip.to_lowercase() == ip.to_lowercase() {
                    already_exists = true;
                    break;
                }
            }
        }
    }

    if !already_exists {
        let mut new_server = std::collections::HashMap::new();
        new_server.insert("name".to_string(), NbtTag::String(name));
        new_server.insert("ip".to_string(), NbtTag::String(ip));
        servers_list.push(NbtTag::Compound(new_server));
    }

    root_compound.insert("servers".to_string(), NbtTag::List(10, servers_list));

    let mut serialized = Vec::new();
    serialized.push(10); // TAG_Compound root type
    write_string("", &mut serialized);
    write_tag(&NbtTag::Compound(root_compound), &mut serialized);

    let compressed_file = fs::File::create(&servers_path).map_err(|e| format!("Failed to create/write servers.dat: {e}"))?;
    let mut encoder = GzEncoder::new(compressed_file, Compression::default());
    encoder.write_all(&serialized).map_err(|e| format!("Failed to compress and write servers.dat: {e}"))?;
    encoder.finish().map_err(|e| format!("Failed to flush compressed servers.dat: {e}"))?;

    Ok(())
}
