import { QueryPlan } from '@apollo/query-planner';

export const getQueryPlanDiagram = (queryPlan: QueryPlan): string => {
  const queryPlanNode = queryPlan.node;
  try {
    return `
    graph TD
      ${process(queryPlanNode).nodeText}
  `.trim();
  } catch (e) {
    return '';
  }
}
const process = (currentNode) => {
  switch (currentNode.kind) {
    case 'Sequence': {
      const processedChildren = currentNode.nodes.map(process);
      return {
        startHash: processedChildren[0]?.startHash,
        endHash: processedChildren.slice(-1)[0]?.endHash,
        nodeText: processedChildren
          .map((processedChild, i) => {
            if (i === 0) return processedChild.nodeText;
            const link = `${processedChildren[i - 1]?.endHash} --> ${processedChild.startHash
              }`;
            return `
              ${link}
              ${processedChild.nodeText}
            `;
          })
          .join(''),
      };
    }
    case 'Parallel': {
      const nodeHash = hash();
      return {
        startHash: nodeHash,
        endHash: nodeHash,
        nodeText: `
          ${nodeHash}("Parallel")

          ${currentNode.nodes
            .map((node) => {
              const processedChild = process(node);
              return `
                ${nodeHash} --> ${processedChild.startHash}
                ${processedChild.nodeText}
              `;
            })
            .join('')}
        `,
      };
    }
    case 'Fetch': {
      // TODO (jason) get tooltips to work here, seems to not be creating the
      // node at all. Should create node with class .mermaidTooltip
      // const tooltip = currentNode.operation
      //   ? `${currentNodeHash}_operation["${print(
      //       parse(currentNode.operation),
      //     ).replaceAll('\n', '<br/>')}"] -...- ${currentNodeHash}`
      //   : 'click ${nodeHash} unDefinedCallback "TooltipContents"';
      const nodeHash = hash();
      return {
        startHash: nodeHash,
        endHash: nodeHash,
        nodeText: `${nodeHash}("Fetch (${currentNode.serviceName})")`,
      };
    }
    case 'Flatten': {
      const nodeHash = hash();
      const processedChild = process(currentNode.node);

      return {
        startHash: processedChild.startHash,
        endHash: nodeHash,
        nodeText: `
          ${nodeHash}("Flatten (${currentNode.path
            .join(',')
            .replace(/@/g, '[]')})")
          
          ${processedChild.endHash} --> ${nodeHash}
          ${processedChild.nodeText}
        `,
      };
    }
    default:
      return currentNode;
  }
}
const hash = () => (Date.now() + Math.random().toString()).replace(/\./g, '');