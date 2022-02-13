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


## Space Avaialble

Total Needed Space = M
Measured Max Distance = Wm
Space Avaialble = S (pixels)
Conversion between pixel to measured space = R

Point in pixel space = Ps
Point in measured space = Pm

Ps = Pm * R
Width of left most box = W1s (in pixel space)
Width of right most box = W2s
Pm = Ps / R

M = W1s/2R + Wm + W2s/2R

R = S/M

M = MW1s/2S + Wm + MW2s/2S
M = M (W1s/2S + W2s/2S) + Wm
M = M (W1s+W2s)/2S + Wm
M - M (W1s+W2s)/2S = Wm
M ( 1 - (W1s+W2s)/2S) = Wm
M =  Wm / ( 1 - (W1s+W2s)/2S)

Wm = 3000
W1s = 20
W2s = 30
S = 200

M = 3000 / ( 1 - (20+30)/400)
M = 3000 / (1 - 50/400)
M = 3000 / (1 - 1/8)
M = 3000 / (7/8)
M = 3000 * 8 /7
M = 3428.571

## Expandable Graph in Graph

SimpleGraph
    onResize - useGraphResize - resizes the graph
    onNodePositioned - places a node position
    <MiniGraph> - simpleNodes, positions them
        - overlap check
        - calls ResizeNeeded
        - Renders use <Node>
        - Calls OnNodePositioned when changing position
    <Edges> - renders the edges to the screenNodes

ExpandableGraph
    onResize - useGraphResize
    Render<MiniGraph> - flag to render sub-nodes
        - overlap check
        - calls ResizeNeed
        - Renders use <node>, includes subNodes
          - Renders using <MiniGraph>
            - overlap check
            - Resize
          - Resize Node (as outer Node of Graph)
          - Calls onNodePosition when resizing


When expanding a sub-graph the mini-graph will arrange nodes using a fixed width. Nodes are rendered to a fixed screen size (the size of the parent node in the parent graph). If any of the nodes are overlapping based on the graph layout it will request that the parent expands the node. This request is handled by the parent node (L2-nodes->sub-graph.mini-graph->node) via the hook `useGraphResize`. The Node component maintains a size override. 

When the Node is resized the parent MiniGraph is notified via the onNodesPositioned callback so that the MiniGraph has an accurate picture of all positions and sizes (see posSizes).



