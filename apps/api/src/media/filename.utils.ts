import { extname } from "path";

const MOJIBAKE_PATTERN = /[ÃÂÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/;
const READABLE_SEGMENT_PATTERN = /[A-Za-z0-9][A-Za-z0-9._ -]*/g;

const hasBrokenReplacementChars = (value: string): boolean => value.includes("\uFFFD");

const buildReadableFallback = (value: string): string => {
  const extension = extname(value);
  const readable = value.match(READABLE_SEGMENT_PATTERN)?.join(" ").trim();

  if (readable && readable !== extension) {
    return readable;
  }

  return extension ? `上传文件${extension}` : "上传文件";
};

export const decodeUploadedFileName = (value: string): string => {
  if (!value || !MOJIBAKE_PATTERN.test(value)) {
    return value;
  }

  const decoded = Buffer.from(value, "latin1").toString("utf8");
  if (decoded.includes("\uFFFD")) {
    return value;
  }

  return decoded;
};

export const normalizeUploadedFileName = (value: string): string => {
  const decoded = decodeUploadedFileName(value);

  if (hasBrokenReplacementChars(decoded) || MOJIBAKE_PATTERN.test(decoded)) {
    return buildReadableFallback(decoded);
  }

  return decoded;
};
