# Diagrams

A collection of components for creating auto-layout diagrams from data.

## @diagrams/graph

A force-based layout for directed acyclic graphs. This diagram uses a slight variation where nodes in the graph are also leaf nodes in a hierarchy that also relates and groups nodes together. Relationships (edges) between the nodes are aggregated up the hierarchy so that parent nodes inherit their children's relationships.




```

<Graph graph={graph}

    selectedNode={selectedNode}
    onSelectNode={({ text }) => setNode(text)} >
    <Message feedTo="start" startDelay={0.1}>
    </Graph>

```

-   Deferred start based on time
-   Messages owned by node, sent across each edge
-   When complete callback used with all expired messages
-   Owner (the Graph) removes messages from node A and propagages them to node B and C
-   Circular dependencies are fine, messages just keep going
