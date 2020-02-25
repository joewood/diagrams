# sim-v

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
