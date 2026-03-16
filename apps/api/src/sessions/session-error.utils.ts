import {
  BadGatewayException,
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { TvControllerError, type SessionInfo } from '@tv-controller/core';

const brittleUpnpErrorPattern = /findtext|errorCode|errorDescription/i;

const translatePlaybackErrorMessage = (message: string): string => {
  if (/AVTransportError:\s*716\b/i.test(message) || /Resource not found/i.test(message)) {
    return '电视无法访问这个媒体地址。请确认 PUBLIC_BASE_URL 使用的是电脑当前局域网 IP，并检查 Windows 防火墙是否放行后端端口。';
  }

  if (/AVTransportError:\s*714\b/i.test(message)) {
    return '电视不接受当前媒体类型。请检查内容类型是否正确，例如视频使用 video/mp4，图片使用 image/jpeg 或 image/png。';
  }

  if (/AVTransportError:\s*704\b/i.test(message)) {
    return '电视不支持当前媒体格式或编码。建议优先使用 H.264/AAC 的 MP4，图片优先使用 JPG 或 PNG。';
  }

  if (/ECONNREFUSED|ETIMEDOUT|EHOSTUNREACH|ENETUNREACH/i.test(message)) {
    return '无法连接到电视的播控服务。请确认电视已开机、与电脑在同一网段，并允许局域网控制。';
  }

  if (brittleUpnpErrorPattern.test(message)) {
    return '电视返回了不标准的播放错误响应。系统已经做了兼容重试；如果仍失败，通常是媒体地址不可达或电视不支持当前格式。';
  }

  return message;
};

const toHttpException = (error: unknown) => {
  if (!(error instanceof TvControllerError)) {
    return new BadGatewayException(
      translatePlaybackErrorMessage(error instanceof Error ? error.message : '播放请求失败'),
    );
  }

  switch (error.code) {
    case 'DEVICE_NOT_FOUND':
      return new NotFoundException('未找到目标设备，请先重新扫描电视。');
    case 'SESSION_NOT_FOUND':
      return new NotFoundException('播放会话不存在，请重新发起播放。');
    case 'SESSION_RENDERER_MISSING':
      return new ConflictException('当前会话的设备连接已失效，请重新发起播放。');
    case 'PLAYBACK_START_FAILED':
      return new ServiceUnavailableException(translatePlaybackErrorMessage(error.message));
    default:
      return new BadGatewayException(translatePlaybackErrorMessage(error.message));
  }
};

export const throwSessionHttpError = (error: unknown): never => {
  throw toHttpException(error);
};

export const localizeSessionInfo = (session: SessionInfo): SessionInfo => {
  if (!session.lastError) {
    return session;
  }

  return {
    ...session,
    lastError: translatePlaybackErrorMessage(session.lastError),
  };
};
