import { describe, expect, it } from "vitest";

import { createRendererMetadata, shouldRetryWithoutRichMetadata } from "../src/metadata-utils";

describe("metadata-utils", () => {
  it("sanitizes non-ascii metadata for renderer compatibility", () => {
    const metadata = createRendererMetadata({
      sourceType: "upload",
      type: "video",
      url: "http://localhost/test.mp4",
      contentType: "video/mp4",
      title: "测试视频",
      metadata: {
        creator: "José",
        artist: "Björk"
      }
    });

    expect(metadata.title).toBeUndefined();
    expect(metadata.creator).toBe("Jose");
    expect(metadata.artist).toBe("Bjork");
    expect(metadata.type).toBe("video");
  });

  it("marks brittle XML parsing errors as retryable", () => {
    expect(shouldRetryWithoutRichMetadata(new Error("Cannot read properties of null (reading 'findtext')"))).toBe(true);
    expect(shouldRetryWithoutRichMetadata(new Error("AVTransportError: 716 - Resource not found"))).toBe(false);
  });
});
