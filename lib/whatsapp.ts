"use client";

import JSZip from "jszip";

export type ChatMessage = {
  timestamp: Date;
  sender: string;
  text: string;
  attachmentFilename: string | null;
};

export type UnzippedChat = {
  chatText: string;
  mediaFiles: Map<string, File>;
};

// WhatsApp export line formats. Lines may be prefixed with an invisible LRM
// mark (U+200E). Two-digit or four-digit years, with/without seconds,
// with/without AM/PM all vary by export locale/OS version.
const IOS_LINE = /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),\s(\d{1,2}:\d{2}(?::\d{2})?\s?[AP]?M?)\]\s([^:]+):\s(.*)$/;
const ANDROID_LINE = /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s(\d{1,2}:\d{2}(?:\s?[AP]M)?)\s-\s([^:]+):\s(.*)$/;
const ATTACHED_IOS = /^<attached:\s*(.+?)>$/;
const ATTACHED_ANDROID = /^(.+?)\s\(file attached\)$/;

const AUDIO_EXTENSIONS = /\.(opus|ogg|m4a|mp3|aac|wav)$/i;

export async function unzipChatExport(zipFile: File): Promise<UnzippedChat> {
  const zip = await JSZip.loadAsync(zipFile);
  let chatText = "";
  const mediaFiles = new Map<string, File>();

  const entries = Object.values(zip.files);
  for (const entry of entries) {
    if (entry.dir) continue;
    const baseName = entry.name.split("/").pop() ?? entry.name;
    if (/^_chat\.txt$/i.test(baseName)) {
      chatText = await entry.async("string");
    } else {
      const blob = await entry.async("blob");
      mediaFiles.set(baseName, new File([blob], baseName));
    }
  }

  if (!chatText) throw new Error("_chat.txt not found in the zip");
  return { chatText, mediaFiles };
}

function parseTimestamp(dateStr: string, timeStr: string): Date {
  const [d, m, yRaw] = dateStr.split("/").map((n) => parseInt(n, 10));
  const year = yRaw < 100 ? 2000 + yRaw : yRaw;

  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s?([AP]M)?/i);
  if (!timeMatch) return new Date(year, m - 1, d);

  let hour = parseInt(timeMatch[1], 10);
  const minute = parseInt(timeMatch[2], 10);
  const second = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
  const meridiem = timeMatch[4]?.toUpperCase();
  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;

  return new Date(year, m - 1, d, hour, minute, second);
}

function extractAttachment(body: string): { text: string; filename: string | null } {
  const iosAttach = body.match(ATTACHED_IOS);
  if (iosAttach) return { text: "", filename: iosAttach[1].trim() };
  const androidAttach = body.match(ATTACHED_ANDROID);
  if (androidAttach) return { text: "", filename: androidAttach[1].trim() };
  return { text: body, filename: null };
}

export function parseChatText(chatText: string): ChatMessage[] {
  const lines = chatText.split(/\r?\n/);
  const messages: ChatMessage[] = [];

  for (const rawLine of lines) {
    const line = rawLine.replace(/^[\u200e\u200f]/, "");
    const match = line.match(IOS_LINE) ?? line.match(ANDROID_LINE);

    if (match) {
      const [, dateStr, timeStr, sender, body] = match;
      const { text, filename } = extractAttachment(body.trim());
      messages.push({
        timestamp: parseTimestamp(dateStr, timeStr),
        sender: sender.trim(),
        text,
        attachmentFilename: filename,
      });
    } else if (messages.length > 0 && rawLine.trim()) {
      const prev = messages[messages.length - 1];
      prev.text = prev.text ? `${prev.text}\n${rawLine.trim()}` : rawLine.trim();
    }
  }

  return messages;
}

export function distinctSenders(messages: ChatMessage[]): string[] {
  return Array.from(new Set(messages.map((m) => m.sender)));
}

export function isVoiceNoteFilename(filename: string): boolean {
  return AUDIO_EXTENSIONS.test(filename);
}
