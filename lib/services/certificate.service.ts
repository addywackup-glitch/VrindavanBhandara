// =============================================================================
// VRINDAVAN BHANDARA — Certificate Service
// Public verification + download tracking. (Generation/PDF rendering is a
// separate concern handled by the certificate generator when wired up.)
// =============================================================================

import { certificateRepository } from "@/lib/repositories";
import { execute } from "@/lib/api/service";
import { NotFoundError } from "@/lib/errors";

export function verifyCertificate(verifyCode: string) {
  return execute(async () => {
    const certificate = await certificateRepository.findByVerifyCode(verifyCode);
    if (!certificate) throw new NotFoundError("Certificate");

    // Best-effort download counter — never blocks the response.
    void certificateRepository.incrementDownload(certificate.id).catch(() => {});

    return {
      verifyCode: certificate.verifyCode,
      url: certificate.url,
      generatedAt: certificate.generatedAt.toISOString(),
      booking: {
        bookingNumber: certificate.booking.bookingNumber,
        sevaDate: certificate.booking.sevaDate.toISOString(),
        beneficiary: certificate.booking.user.name,
        service: certificate.booking.package.serviceCategory.name,
      },
    };
  });
}
