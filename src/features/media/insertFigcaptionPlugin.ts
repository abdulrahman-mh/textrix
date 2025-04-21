import { Plugin, PluginKey, NodeSelection } from "prosemirror-state";

export function insertFigcaptionPlugin() {
  return new Plugin({
    key: new PluginKey("insertFigcaptionPlugin"),

    appendTransaction(transactions, oldState, newState) {
      const lastTr = transactions[transactions.length - 1];
      if (!lastTr.selectionSet) return;

      const { selection } = newState;
      if (!(selection instanceof NodeSelection)) return;

      const selectedNode = selection.node;
      if (!selectedNode) return;

      const resolvedPos = lastTr.doc.resolve(selection.from);
      const parentNode = resolvedPos.node(1); // could be figure or imagesGrid
      const parentNodePos = resolvedPos.before(1);

      if (!parentNode) return;

      const figcaptionType = newState.schema.nodes.figcaption;
      if (!figcaptionType) return;

      const figcaptionWasDeleted = transactions.some((tr) =>
        tr.steps.some((step) => {
          const json = step.toJSON();
          return (
            json.stepType === "ReplaceStep" &&
            JSON.stringify(json.slice?.content || []).includes('"type":"figcaption"')
          );
        })
      );
      if (figcaptionWasDeleted) return;

      const figcaptionNode = figcaptionType.create();

      if (parentNode.type.name === "figure") {
        const hasFigcaption = parentNode.content.content.some(
          (child) => child.type.name === "figcaption"
        );
        if (hasFigcaption) return;

        const insertAt = parentNodePos + 1 + selectedNode.nodeSize;
        const mappedInsertPos = lastTr.mapping.map(insertAt);

        return newState.tr.insert(mappedInsertPos, figcaptionNode);
      }

      if (parentNode.type.name === "imagesGrid") {
        const firstFigure = parentNode.child(0);
        if (!firstFigure) return;
      
        const hasFigcaption = firstFigure.content.content.some(
          (child) => child.type.name === "figcaption"
        );
        if (hasFigcaption) return;
      
        // Position of the first figure node inside imagesGrid
        const figurePos = parentNodePos + 1; // +1 to get inside the grid
        const insertAt = figurePos + 1 + firstFigure.content.size; // +1 to get inside the figure
      
        const mappedInsertPos = lastTr.mapping.map(insertAt);
      
        return newState.tr.insert(mappedInsertPos, figcaptionNode);
      }
      

      return null;
    },
  });
}
