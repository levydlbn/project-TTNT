let map, start, end, route;
let choosePoint = "start";
let markers = [];
let markerStart = [];
let markerEnd = [];
let pointStart;
let pointEnd;
let allNodeMarkers = [];
let node_passed = [];
let allNodePassed = [];
const geofenceColor = "white";
const pathColor = "blue";
const iconStart = "../image/startIcon.png"
const iconEnd = "../image/end-icon-12.png"

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: centerNode,
        zoom: 17,
    });

    const geocoder = new google.maps.Geocoder();
    const infowindowStart = new google.maps.InfoWindow();
    const infowindowEnd = new google.maps.InfoWindow();

    // Construct the geofence
    const geofence = new google.maps.Polygon({
        paths: listNodeGeofence,
        strokeColor: geofenceColor,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: geofenceColor,
        fillOpacity: 0.2,
    });
    geofence.setMap(map);

    // const trafficLayer = new google.maps.TrafficLayer();
    // trafficLayer.setMap(map);


    // Click geofence
    geofence.addListener("click", (geofenceMouseClick) => {
        if (allNodeMarkers.length !== 0) {
            siiimpleToast.alert("Bạn phải ẩn tất cả các node để tìm đường", { duration: 3000 });
            return;
        }
        if (choosePoint === "start") {
            if (route) {
                removePath();
                clearPathMarker();
            }
            start = geofenceMouseClick.latLng.toJSON();
            pointStart = start;
            choosePoint = "end";
            createMarker(start, "S");
            if (markerStart.length === 0) {
                const marker = new google.maps.Marker({
                    position: start,
                    map,
                    label: {
                        text: "S",
                        color: "white",
                    },
                });
                markerStart.push(marker)
            } else {

                markerStart[0].setMap(null)
                markerStart = []
                const marker = new google.maps.Marker({
                    position: start,
                    map,
                    label: {
                        text: "S",
                        color: "white",
                    },
                });
                markerStart.push(marker)
            }
        } else if (choosePoint === "end") {
            end = geofenceMouseClick.latLng.toJSON();
            pointEnd = end;
            choosePoint = "start";
            createMarker(end, "E");
            if (markerEnd.length === 0) {
                const marker = new google.maps.Marker({
                    position: end,
                    map,
                    label: {
                        text: "E",
                        color: "#2df03d"
                    }
                });
                markerEnd.push(marker)
            } else {
                if (allNodePassed.length !== 0) {
                    for (let i = 0; i < node_passed.length; i++) {
                        allNodePassed[i].setMap(null);
                    }
                }
                allNodePassed = [];
                markerEnd[0].setMap(null)
                markerEnd = []
                const marker = new google.maps.Marker({
                    position: end,
                    map,
                    label: {
                        text: "E",
                        color: "#2df03d"
                    }
                });
                markerEnd.push(marker)
            }
            const path = findPath(start, end);
            node_passed = path;
            drawPath(path);
            siiimpleToast.success(`Đề xuất đường đi qua ${path.length - 2} Node`, {
                duration: 4000,
            });
        }
    });


    document.querySelector(".btn-search-new-path").addEventListener("click", () => {
        let graph1 = createGraph();
        removePath()
        let nodeError = null

        nodeError = document.getElementById("input-node-error").value;
        const arraylink = Object.entries(listLink).filter(item => item[0] !== `${nodeError}`)
        const listLinkNew = Object.fromEntries(arraylink)
        const listNodeDetected = listNode.map((item) => {
            return { x: item.lat, y: item.lng };
        });

        console.log(listLink)
        console.log(listLinkNew)
            // Add node and link to graph
        listNodeDetected.forEach((item, index) => graph1.addNode(`${index + 1}`, item));
        for (const [key, value] of Object.entries(listLinkNew)) {
            value.forEach((item) => graph1.addLink(`${key}`, `${item}`));
        }

        function findPath1(start, end) {
            startDetected = detectPosition(start);
            endDetected = detectPosition(end);
            startNode = findNearestNode(startDetected);
            endNode = findNearestNode(endDetected);

            // Find path by astar
            let pathFinder = ngraphPath.aStar(graph1, {
                distance(fromNode, toNode) {
                    let dx = fromNode.data.x - toNode.data.x;
                    let dy = fromNode.data.y - toNode.data.y;
                    console.log(Math.sqrt(dx * dx + dy * dy))
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


        const newPath = findPath1(pointStart, pointEnd);
        node_passed = newPath;
        drawPath(newPath);
        siiimpleToast.success(`Đề xuất đường đi qua ${newPath.length - 2} Node`, {
            duration: 4000,
        });

        console.log(newPath)

    })







    // Create marker
    function createMarker(position, label = "") {
        geocoder.geocode({ location: position }, (results, status) => {
            if (status === "OK") {
                if (results[0]) {
                    const marker = new google.maps.Marker({
                        position: position,
                        map,
                        label: label,
                    });
                    if (label === "S") {
                        markers[0] = marker;
                        infowindowStart.setContent(results[0].formatted_address);
                        infowindowStart.open(map, marker);
                    } else if (label === "E") {
                        markers[1] = marker;
                        infowindowEnd.setContent(results[0].formatted_address);
                        infowindowEnd.open(map, marker);
                    }
                }
            }
        });
    }

    function clearPathMarker() {
        for (let i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
        }
        markers = [];
    }

    // Draw path
    function drawPath(path) {
        route = new google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: pathColor,
            strokeOpacity: 1.0,
            strokeWeight: 4,
        });

        route.setMap(map);
    }

    // Remove path
    function removePath() {
        if (route) route.setMap(null);
    }

    // Click outside
    map.addListener("click", () => {
        siiimpleToast.alert("Vui lòng chọn trong khu vực phường Cửa Đông");
    });

    document.querySelector("#btn-display-node-passed").addEventListener("click", () => {
        if (allNodePassed.length === 0 && node_passed.length !== 0) {
            for (let i = 0; i < node_passed.length; i++) {
                const marker = new google.maps.Marker({
                    position: node_passed[i],
                    map,
                    label: {
                        text: `${i + 1}`,
                        color: "white"
                    },
                });
                allNodePassed.push(marker);
            }
            document.querySelector("#btn-display-node-passed").innerHTML = "Hide nodes passed";
        } else {
            for (let i = 0; i < node_passed.length; i++) {
                allNodePassed[i].setMap(null);
            }
            allNodePassed = [];
            document.querySelector("#btn-display-node-passed").innerHTML = "Show nodes passed";
        }
    })

    // Show all node
    document.querySelector("#btn-display").addEventListener("click", () => {
        clearPathMarker();
        choosePoint = "start";
        if (allNodeMarkers.length === 0) {
            for (let i = 0; i < listNode.length; i++) {
                const marker = new google.maps.Marker({
                    position: listNode[i],
                    map,
                    label: `${i + 1}`,
                });
                allNodeMarkers.push(marker);
            }
            siiimpleToast.message(`Show all ${listNode.length} nodes`, { duration: 4000 });
            document.querySelector("#btn-display").innerHTML = "Hide all nodes";
        } else {
            for (let i = 0; i < allNodeMarkers.length; i++) {
                allNodeMarkers[i].setMap(null);
            }
            allNodeMarkers = [];
            siiimpleToast.message(`Hide all ${listNode.length} nodes`, { duration: 4000 });
            document.querySelector("#btn-display").innerHTML = "Show all nodes";
        }
    });
}