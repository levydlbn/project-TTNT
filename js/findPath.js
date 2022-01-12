let graph = createGraph();

// Detect listNode data (lat, lng) to (x, y)
const listNodeDetected = listNode.map((item) => {
    return { x: item.lat, y: item.lng };
});

// Add node and link to graph
listNodeDetected.forEach((item, index) => graph.addNode(`${index + 1}`, item));
for (const [key, value] of Object.entries(listLink)) {
    value.forEach((item) => graph.addLink(`${key}`, `${item}`));
}

// Main function find path
function findPath(start, end) {
    startDetected = detectPosition(start);
    endDetected = detectPosition(end);
    startNode = findNearestNode(startDetected);
    endNode = findNearestNode(endDetected);

    // Find path by astar
    let pathFinder = ngraphPath.aStar(graph, {
        distance(fromNode, toNode) {
            let dx = fromNode.data.x - toNode.data.x;
            let dy = fromNode.data.y - toNode.data.y;

            return Math.sqrt(dx * dx + dy * dy);
        },
    });

    const route = pathFinder.find(startNode.id, endNode.id);
    const resultPath = route.reverse().map((item) => {
        return { lat: item.data.x, lng: item.data.y };
    });
    resultPath.push(end);
    resultPath.unshift(start);
    return resultPath;
    // return optimizeResult(resultPath);
}

// Detect position (x, y) from (lat, lng)
function detectPosition(position) {
    return { x: position.lat, y: position.lng };
}

// Find nearest node to a node
function findNearestNode(nodeFind) {
    let minDistance = 0;
    let foundNode;
    graph.forEachNode(function(node) {
        distance = calculateDistance(node.data, nodeFind);
        if (minDistance === 0 || distance < minDistance) {
            minDistance = distance;
            foundNode = node;
        }
    });

    console.log(foundNode)
    return foundNode;

}

// Optimize start and end node
// function optimizeResult(result) {
//   if (result.length > 2) {
//     if (
//       calculateDistance(result[0], result[2]) <
//       calculateDistance(result[1], result[2])
//     ) {
//       result.splice(1, 1);
//     }
//     if (result.length > 2) {
//       if (
//         calculateDistance(
//           result[result.length - 1],
//           result[result.length - 3]
//         ) <
//         calculateDistance(result[result.length - 2], result[result.length - 3])
//       ) {
//         result.splice(result.length - 2, 1);
//       }
//     }
//   }
//   return result;
// }

// Calculate distance between two node
function calculateDistance(fromNode, toNode) {
    let dx = fromNode.x ? fromNode.x - toNode.x : fromNode.lat - toNode.lat;
    let dy = fromNode.y ? fromNode.y - toNode.y : fromNode.lng - toNode.lng;

    return Math.sqrt(dx * dx + dy * dy);
}