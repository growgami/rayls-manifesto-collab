import html2canvas from 'html2canvas';

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
 * Downloads the signature card as a PNG image
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
    // Find the gradient badge element and temporarily fix it for html2canvas
    const badgeElement = cardRef.querySelector('.card-badge-number') as HTMLElement;
    let originalStyles: { [key: string]: string } = {};

    if (badgeElement) {
      // Store original styles
      originalStyles = {
        background: badgeElement.style.background,
        webkitBackgroundClip: badgeElement.style.webkitBackgroundClip,
        backgroundClip: badgeElement.style.backgroundClip,
        webkitTextFillColor: badgeElement.style.webkitTextFillColor,
        color: badgeElement.style.color,
      };

      // Apply a solid gradient-like color that html2canvas can render
      badgeElement.style.background = 'linear-gradient(135deg, #b49aff 0%, #ecfb3e 100%)';
      badgeElement.style.webkitBackgroundClip = 'text';
      badgeElement.style.backgroundClip = 'text';
      badgeElement.style.webkitTextFillColor = 'transparent';
      badgeElement.style.color = 'transparent';
    }

    // Use html2canvas to capture the card element
    const canvas = await html2canvas(cardRef, {
      scale: 3, // 3x resolution for high quality images (increased from 2x)
      backgroundColor: '#ffffff', // White background
      useCORS: true, // Allow cross-origin images
      allowTaint: false, // Prevent tainting canvas with cross-origin images
      logging: false, // Disable console logging
      imageTimeout: 15000, // 15 second timeout for image loading
      removeContainer: true, // Clean up after rendering
      width: cardRef.offsetWidth, // Explicitly set width
      height: cardRef.offsetHeight, // Explicitly set height
      windowWidth: cardRef.offsetWidth, // Set rendering window width
      windowHeight: cardRef.offsetHeight, // Set rendering window height
      onclone: (clonedDoc) => {
        // Fix gradient in the cloned document
        const clonedBadge = clonedDoc.querySelector('.card-badge-number') as HTMLElement;
        if (clonedBadge) {
          // Use a purple color as fallback since html2canvas struggles with background-clip: text
          clonedBadge.style.background = 'none';
          clonedBadge.style.webkitBackgroundClip = 'unset';
          clonedBadge.style.backgroundClip = 'unset';
          clonedBadge.style.webkitTextFillColor = '#b49aff';
          clonedBadge.style.color = '#b49aff';
        }
      },
    });

    // Restore original styles
    if (badgeElement) {
      Object.assign(badgeElement.style, originalStyles);
    }

    // Convert canvas to blob with maximum quality
    canvas.toBlob((blob) => {
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
    }, 'image/png', 1.0); // Maximum quality (1.0)
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
