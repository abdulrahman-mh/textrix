import { FeaturesManager } from '../FeaturesManager';

// Use all features that's extends the Schema.
import { Media } from '../features';
import { CodeBlock } from '../features';

/**
 * Builds the schema.
 *
 * The schema defines the document structure and formatting rules.
 * It can be used to generate published content & JSON-to-HTML conversion,
 * & merge document changes & collaboration and more.
 *
 * @returns The built schema.
 */
export function buildSchema() {
  const features = FeaturesManager.getCoreFeatures();
  features.push(CodeBlock, Media);

  return FeaturesManager.buildSchema(features, { published: true });
}
