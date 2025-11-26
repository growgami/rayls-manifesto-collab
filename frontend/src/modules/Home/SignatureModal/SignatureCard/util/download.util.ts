import { snapdom } from '@zumer/snapdom';

interface DownloadCardOptions {
  /**
   * The DOM element reference of the card to convert to image
   */
  cardRef: HTMLElement;
  /**
   * Username for the filename
   */
  username: string;
  /**
   * Signature number for the filename
   */
  signatureNumber: number;
}

/**
 * Downloads the signature card as a PNG image using Snapdom
 *
 * @param options - Configuration for the card download
 * @throws Error if the conversion or download fails
 */
export const downloadSignatureCard = async ({
  cardRef,
  username,
  signatureNumber,
}: DownloadCardOptions): Promise<void> => {
  try {
    // Use Snapdom to capture the card element
    // Snapdom handles complex CSS, pseudo-elements, and absolute positioning better than html2canvas
    const result = await snapdom(cardRef, {
      scale: 3, // 3x resolution for high quality images
      embedFonts: true, // Embed fonts to preserve typography
      backgroundColor: '#ffffff', // White background
      quality: 1.0, // Maximum quality for raster output
    });

    // Convert to PNG blob
    const blob = await result.toBlob({
      type: 'png',
      quality: 1.0, // Maximum quality
    });

    if (!blob) {
      throw new Error('Failed to create image blob');
    }

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `rayls-manifesto-signature-${username}-${signatureNumber}.png`;
    link.href = url;

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    // Enhanced error logging for debugging
    console.error('Failed to download signature card:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    throw new Error('Failed to download signature card. Please try again.');
  }
};
