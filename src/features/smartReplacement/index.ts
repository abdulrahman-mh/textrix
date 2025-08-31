import { Feature } from "../../Feature";
import { textInputRule } from "../../inputRules";

/**
 * Smart Replacement Feature
 *
 * Automatically replaces common text patterns with their typographically correct equivalents:
 * - "--" becomes "—" (em dash)
 */
export const SmartReplacement = Feature.create({
  name: "smartReplacement",

  addInputRules() {
    return [
      // Replace double dash with em dash
      textInputRule({
        find: /--$/,
        replace: "—",
      }),
    ];
  },
});

export default SmartReplacement;
