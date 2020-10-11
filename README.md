# sim-v

```typescript
<Simulation >                       // holds the message as a context
                                    // responsible for drawing messages
<Graph graph={graph}

    selectedNode={selectedNode}
    onSelectNode={({ text }) => setNode(text)} >
    <KafkaProducer key="prod" >          // gets the cotext and adds a node. Node has render responsibilities
        <ConnectedTo to="broker" topic="xxx" />       // defines an edge (get context - add edge). Edge has Partitions like a topic
        <KafkaMessage  />                // pumps a message from the Producer
        <KafkaMessage  />                // must have an egress behavior
        <KafkaMessage  />
    </Producer>
    <Broker key="broker">              // Conceptual Broker
        <Topic partitions={3}>
        <BrokerNode >
        <BrokerNode >
    </Broker>
    <Consumer key="cons">
        <ConnectedFrom from="broker"/>
    </Consumer>
</Graph>

```

12126255710
1607805

In a node:

```

    const [messages,egressMessage,edgesAvailable] = useContext(nodeName);         // timestamped
    const expiredMessage = useExpired(messages);
    useEffect( ()=> {
        for (edges) {
            for (messages) {
                egress(message)
            }
        }
    },[expiredMessages,edgesAvailable] )
    // animate
    <Node>
    { messages.map( x => <Message > )}
    </Node>
```

IN an edge

```

```

-   Deferred start based on time
-   Messages owned by node, sent across each edge
-   When complete callback used with all expired messages
-   Owner (the Graph) removes messages from node A and propagages them to node B and C
-   Circular dependencies are fine, messages just keep going

Separate function for message state

function state()
