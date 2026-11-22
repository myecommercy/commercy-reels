import fs from "fs";
import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setDefaultPremountInSeconds(2);
// 3D scenes: use the GPU through ANGLE (Direct3D on Windows, Metal on macOS)
Config.setChromiumOpenGlRenderer("angle");

// Optional: use an installed Chrome instead of downloading Chrome Headless Shell
// (set REMOTION_CHROME to the chrome executable path)
const chrome = process.env.REMOTION_CHROME;
if (chrome && fs.existsSync(chrome)) {
  Config.setBrowserExecutable(chrome);
}
