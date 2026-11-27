import { db } from "./index";
import { cameras, filmLabs, filmStocks, lenses } from "./schemas/module-2.schema";

export async function seedMasterData() {
  await db
    .insert(filmStocks)
    .values([
      {
        code: "FILM-KODAK-PORTRA-400",
        brand: "Kodak",
        name: "Portra 400",
        nominalIso: 400,
        process: "C-41",
        colorType: "COLOR_NEGATIVE",
        supportedFormats: ["135", "120", "4x5", "8x10"],
        isDxCoded: true,
        description: "Color negative film with fine grain and natural skin tones.",
        status: "ACTIVE",
      },
      {
        code: "FILM-ILFORD-HP5-PLUS-400",
        brand: "Ilford",
        name: "HP5 Plus",
        nominalIso: 400,
        process: "B&W",
        colorType: "BLACK_AND_WHITE",
        supportedFormats: ["135", "120", "4x5"],
        isDxCoded: true,
        description: "Classic black and white film with wide exposure latitude.",
        status: "ACTIVE",
      },
      {
        code: "FILM-FUJIFILM-VELVIA-50",
        brand: "Fujifilm",
        name: "Velvia 50",
        nominalIso: 50,
        process: "E-6",
        colorType: "COLOR_SLIDE_POSITIVE",
        supportedFormats: ["135", "120", "4x5"],
        isDxCoded: true,
        description: "High-saturation daylight color reversal slide film.",
        status: "ACTIVE",
      },
      {
        code: "FILM-CINESTILL-800T-800",
        brand: "CineStill",
        name: "800T",
        nominalIso: 800,
        process: "ECN-2",
        colorType: "MOTION_PICTURE_COLOR",
        supportedFormats: ["135", "120"],
        isDxCoded: false,
        description: "Tungsten-balanced motion picture color negative film.",
        status: "ACTIVE",
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(cameras)
    .values([
      {
        code: "CAM-LEICA-M6",
        brand: "Leica",
        model: "M6 Classic",
        cameraType: "RANGEFINDER",
        supportedFormat: "135",
        defaultLensMount: "Leica M",
        hasFixedLens: false,
        shutterMechanism: "MECHANICAL",
        productionStartYear: 1984,
        productionEndYear: 1998,
        status: "ACTIVE",
      },
      {
        code: "CAM-NIKON-F3-HP",
        brand: "Nikon",
        model: "F3 HP",
        cameraType: "SLR",
        supportedFormat: "135",
        defaultLensMount: "Nikon F",
        hasFixedLens: false,
        shutterMechanism: "HYBRID",
        productionStartYear: 1982,
        productionEndYear: 2001,
        status: "ACTIVE",
      },
      {
        code: "CAM-HASSELBLAD-500CM",
        brand: "Hasselblad",
        model: "500 C/M",
        cameraType: "MEDIUM_FORMAT_SLR",
        supportedFormat: "120",
        defaultLensMount: "Hasselblad V",
        hasFixedLens: false,
        shutterMechanism: "MECHANICAL",
        productionStartYear: 1970,
        productionEndYear: 1994,
        status: "ACTIVE",
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(lenses)
    .values([
      {
        code: "LENS-LEICA-SUMMICRON-35-F2",
        brand: "Leica",
        model: "Summicron-M 35mm f/2 ASPH",
        mountType: "Leica M",
        focalLengthMinMm: "35.00",
        focalLengthMaxMm: null,
        isPrime: true,
        maxAperture: "2.0",
        minAperture: "16.0",
        formatCoverage: ["135"],
        status: "ACTIVE",
      },
      {
        code: "LENS-NIKON-NIKKOR-50-F14",
        brand: "Nikon",
        model: "Nikkor 50mm f/1.4 AI-S",
        mountType: "Nikon F",
        focalLengthMinMm: "50.00",
        focalLengthMaxMm: null,
        isPrime: true,
        maxAperture: "1.4",
        minAperture: "16.0",
        formatCoverage: ["135"],
        status: "ACTIVE",
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(filmLabs)
    .values([
      {
        code: "LAB-VN-LLAB-SG",
        name: "LLab Saigon",
        countryCode: "VN",
        city: "Ho Chi Minh City",
        address: "District 3, Ho Chi Minh City",
        supportedProcesses: ["C-41", "B&W", "E-6", "ECN-2"],
        scanners: ["NORITSU_HS1800", "FUJI_FRONTIER_SP3000"],
        isVerifiedPartner: true,
        status: "ACTIVE",
      },
      {
        code: "LAB-VN-CROPLAB-HN",
        name: "CropLab Hanoi",
        countryCode: "VN",
        city: "Hanoi",
        supportedProcesses: ["C-41", "B&W"],
        scanners: ["FUJI_FRONTIER_SP3000", "EPSON_V850"],
        isVerifiedPartner: true,
        status: "ACTIVE",
      },
    ])
    .onConflictDoNothing();
}
