(function() {

function stopPropagation(event) {
    event.stopPropagation();
    return event;
}

var d3 = d3 || d3_tiny;

function svgNode(name) { return document.createElementNS(d3.ns.prefix.svg, name); }
function htmlNode(name) { return document.createElementNS(d3.ns.prefix.html, name); }

/* ========================= util/number ========================= */

Rpd.channelrenderer('util/number', 'svg', {
    /* show: function(target, value) { }, */
    edit: function(target, inlet, valueIn) {
        var foElm = svgNode('foreignObject');
        foElm.setAttributeNS(null, 'width', 20);
        foElm.setAttributeNS(null, 'height', 30);
        var valInput = htmlNode('input');
        valInput.type = 'number';
        //valInput.style.position = 'absolute';
        valueIn.onValue(function(val) {
            valInput.value = val;
        });
        foElm.appendChild(valInput);
        target.appendChild(foElm);
        return Kefir.fromEvents(valInput, 'change')
                    .map(function() {
                        return valInput.value;
                    });
    }
});

/* ========================= util/random ========================= */

Rpd.noderenderer('util/random', 'svg', function() {
    return {
        size: { width: 40 }
    }
});

/* ========================= util/bang ========================= */

Rpd.noderenderer('util/bang', 'svg', {
    size: { width: 30, height: 25 },
    first: function(bodyElm) {
        var circle = d3.select(svgNode('circle'))
                       .attr('cx', 15).attr('r', 9)
                       .attr('fill', 'black')
                       .style('cursor', 'pointer')
                       .style('pointer-events', 'all');
        d3.select(bodyElm).append(circle.node());
        return { 'trigger':
            { valueOut: Kefir.fromEvents(circle.node(), 'click')
                             .map(function() { return {}; })
            }
        };
    }
});

/* ========================= util/metro ========================= */

Rpd.noderenderer('util/metro', 'svg', {
    size: { width: 30, height: 25 },
    first: function(bodyElm) {
        var circle = d3.select(svgNode('circle'))
                       .attr('cx', 15).attr('r', 9)
                       .attr('fill', 'black')
                       .style('cursor', 'pointer')
                       .style('pointer-events', 'all');
        d3.select(bodyElm).append(circle.node());
        return { 'trigger':
            { valueOut: Kefir.fromEvents(circle.node(), 'click')
                             .map(function() { return {}; })
            }
        };
    }
});

/* ========================= util/palette ========================= */

/* Rpd.noderenderer('util/palette', 'svg', function() {
    var cellSide = 12;
    return {
        size: { width: 365, height: 60 },
        first: function(bodyElm) {
            var paletteChange = Kefir.emitter();
            var lastSelected, paletteGroups = [];
            d3.select(bodyElm)
              .append('g').attr('transform', 'translate(5, 0)')
              .call(function(target) {
                PALETTES.forEach(function(palette, i) {
                    target.append('g')
                          .attr('class', 'rpd-util-palette-variant')
                          .attr('transform', 'translate(' + (i * 14) + ', ' +
                                                            (-1 * (palette.length / 2 * cellSide)) + ')')
                          .call((function(palette) { return function(paletteGroup) {
                              palette.forEach(function(color, i) {
                                  paletteGroup.append('rect').attr('rx', 4)
                                              .attr('x', 0).attr('y', i * cellSide)
                                              .attr('width', cellSide).attr('height', cellSide)
                                              .attr('fill', color);
                              });
                              Kefir.fromEvents(paletteGroup.node(), 'click').onValue(function() {
                                  if (lastSelected) lastSelected.attr('class', 'rpd-util-palette-variant')
                                  paletteGroup.attr('class', 'rpd-util-palette-variant rpd-util-palette-active-variant');
                                  lastSelected = paletteGroup;
                                  paletteChange.emit(palette);
                              });
                              paletteGroups.push(paletteGroup);
                          } })(palette));
                });
            });
            lastSelected = paletteGroups[0];
            paletteGroups[0].attr('class', 'rpd-util-palette-variant rpd-util-palette-active-variant');
            return { 'selection': { valueOut: paletteChange } };
        }
    };
}); */

/* ========================= util/sum-of-three ========================= */

Rpd.noderenderer('util/sum-of-three', 'svg', function() {
    var textElement;
    return {
        //contentRule: 'replace',
        size: { width: 150, height: null },
        first: function(bodyElm) {
            textElement = svgNode('text');
            bodyElm.appendChild(textElement);
        },
        always: function(bodyElm, inlets, outlets) {
            textElement.innerHTML = '∑ (' + (inlets.a || '?') + ', '
                                          + (inlets.b || '?') + ', '
                                          + (inlets.c || '?') + ') = ' + (outlets.sum || '?');
        }
    }
});

/* ========================= util/knob & util/knobs ========================= */

function createKnob(state) {
    var radius = 13;
    var speed = 1.5;
    var lastValue = 0;
    //var state = { min: 0, max: 100 };

    return {
        init: function(parent) {
            var hand, handGhost, face, text;
            var submit = Kefir.emitter();
            d3.select(parent)
              .call(function(bodyGroup) {
                  face = bodyGroup.append('circle')
                                  .attr('cx', 20).attr('r', radius)
                                  .style('fill', 'rgba(200, 200, 200, .2)')
                                  .style('stroke-width', 2)
                                  .style('stroke', '#000');
                  handGhost = bodyGroup.append('line')
                                  .style('visibility', 'hidden')
                                  .attr('x1', 20).attr('y1', 0)
                                  .attr('x2', 20).attr('y2', radius - 1)
                                  .style('stroke-width', 2)
                                  .style('stroke', 'rgba(255,255,255,0.1)');
                  hand = bodyGroup.append('line')
                                  .attr('x1', 20).attr('y1', 0)
                                  .attr('x2', 20).attr('y2', radius)
                                  .style('stroke-width', 2)
                                  .style('stroke', '#000');
                  text = bodyGroup.append('text').attr('x', 20)
                                  .style('text-anchor', 'middle')
                                  .style('fill', '#fff')
                                  .text(0);
              });
            Kefir.fromEvents(parent, 'mousedown')
                 .map(stopPropagation)
                 .flatMap(function() {
                     handGhost.style('visibility', 'visible');
                     var values =
                        Kefir.fromEvents(document.body, 'mousemove')
                            //.throttle(50)
                             .takeUntilBy(Kefir.fromEvents(document.body, 'mouseup'))
                             .map(stopPropagation)
                             .map(function(event) {
                                 var faceRect = face.node().getBoundingClientRect();
                                 return { x: event.clientX - (faceRect.left + radius),
                                          y: event.clientY - (faceRect.top + radius) };
                             })
                             .map(function(coords) {
                                 var value = ((coords.y * speed * -1) + 180) / 360;
                                 if (value < 0) {
                                     value = 0;
                                 } else if (value > 1) {
                                     value = 1;
                                 }
                                 return value;
                            });
                     values.last().onValue(function(val) {
                         lastValue = val;
                         handGhost.attr('transform', 'rotate(' + (lastValue * 360) + ',20,0)')
                                  .style('visibility', 'hidden');
                         submit.emit(lastValue);
                     });
                     return values;
                 }).onValue(function(value) {
                     text.text(adaptToState(state, value));
                     hand.attr('transform', 'rotate(' + (value * 360) + ',20,0)');
                 });
            return submit;
        }
    }
}

function initKnob(knob, nodeRoot, id) {
    var submit;
    d3.select(nodeRoot)
      .append('g')
      .attr('transform', 'translate(' + (id * 40) + ',0)')
      .call(function(knobRoot) {
          knob.root = knobRoot;
          submit = knob.init(knobRoot.node());
      });
    return submit;
}

Rpd.noderenderer('util/knob', 'svg', function() {
    var state = { min: 0, max: 100 };
    var knob = createKnob(state);

    return {
        size: { width: 40, height: 40 },
        first: function(bodyElm) {
            var submit = knob.init(bodyElm);
            return {
                'submit': { valueOut: submit }
            };
        },
        always: function(bodyElm, inlets, outlets) {
            state.min = inlets.min || 0;
            state.max = inlets.max || 0;
        }
    };
});

var DEFAULT_KNOB_COUNT = 4;

Rpd.noderenderer('util/knobs', 'svg', function() {
    var state = { min: 0, max: 100 };
    var knobs = [];
    for (var i = 0; i < DEFAULT_KNOB_COUNT; i++) {
        knobs.push(createKnob(state));
    }
    var nodeRoot;

    return {
        size: { width: 160, height: 40 },
        first: function(bodyElm) {
            var valueOut = Kefir.pool();
            nodeRoot = bodyElm;
            valueOut = Kefir.combine(
                knobs.map(function(knob, i) {
                    return initKnob(knob, nodeRoot, i).merge(Kefir.constant(0)); // so Kefir.combine will send every change
                })
            );
            return {
                'submit': { valueOut: valueOut }
            };
        },
        always: function(bodyElm, inlets, outlets) {
            state.min = inlets.min || 0;
            state.max = inlets.max || 0;
        }
    };
});

/* ========================= util/color ========================= */

var toHexColor = RpdUtils.toHexColor;

Rpd.noderenderer('util/color', 'svg', function() {
    var colorElm;
    return {
        size: { width: 140, height: 30 },
        first: function(bodyElm) {
            colorElm = svgNode('rect');
            colorElm.setAttributeNS(null, 'width', '30');
            colorElm.setAttributeNS(null, 'height', '30');
            colorElm.setAttributeNS(null, 'rx', '5');
            colorElm.setAttributeNS(null, 'ry', '5');
            colorElm.setAttributeNS(null, 'transform', 'translate(-15,-15)');
            colorElm.classList.add('rpd-util-color-display');
            bodyElm.appendChild(colorElm);
        },
        always: function(bodyElm, inlets, outlets) {
            colorElm.setAttributeNS(null, 'fill', toHexColor(outlets.color));
        }
    }
});

/* ========================= util/nodelist ========================= */

var NodeList = RpdUtils.NodeList;
var getNodeTypesByToolkit = RpdUtils.getNodeTypesByToolkit;

var nodeListSize = { width: 180, height: 300 };

var lineHeight = 20;  // find font-size?
var iconWidth = 11;
var inputHeight = 50;

Rpd.noderenderer('util/nodelist', 'svg', {
    size: nodeListSize,
    first: function(bodyElm) {

        var patch = this.patch;

        var nodeTypes = Rpd.allNodeTypes,
            nodeDescriptions = Rpd.allNodeDescriptions,
            toolkitIcons = Rpd.allToolkitIcons,
            nodeTypeIcons = Rpd.allNodeTypeIcons;

        var nodeTypesByToolkit = getNodeTypesByToolkit(nodeTypes);

        var bodyGroup = d3.select(bodyElm)
                           .append('g')
                           .attr('transform', 'translate(' + (-1 * nodeListSize.width / 2) + ','
                                                           + (-1 * nodeListSize.height / 2) + ')');
        var searchGroup = bodyGroup.append('g').classed('rpd-nodelist-search', true)
                                               .attr('transform', 'translate(12,12)');

        var nodeListSvg;

        var tookitElements = {},
            listElementsIdxByType = {};

        var nodeList = new NodeList({
            getPatch: function() { return patch; },
            buildList: function() {
                var listElements = [];

                var bodyRect = bodyGroup.node().getBoundingClientRect();

                var foreignDiv = bodyGroup.append(svgNode('foreignObject'))
                                       .append(htmlNode('div'))
                                       .style('width', (nodeListSize.width - 20) + 'px')
                                       .style('height', (nodeListSize.height - inputHeight) + 'px')
                                       .style('overflow-y', 'scroll')
                                       .style('position', 'relative').style('left', bodyRect.left + 'px')
                                                                     .style('top', (bodyRect.top + inputHeight) + 'px');

                var nodeListSvg = foreignDiv.append(svgNode('svg'))
                                            .classed('rpd-nodelist-list', true)
                                            .attr('height', (nodeListSize.width - 12) + 'px')
                                            .attr('height', (nodeListSize.height - inputHeight) + 'px')
                                            //.attr('overflow', 'scroll')
                                            //.attr('x', '12').attr('y', '45');

                setTimeout(function() {
                    // waits for when the node will be attached to DOM
                    bodyRect = bodyGroup.node().getBoundingClientRect();
                    foreignDiv.style('left', (bodyRect.left + 12) + 'px')
                              .style('top', (bodyRect.top + inputHeight) + 'px')
                }, 100);

                var lastY = 0;

                nodeListSvg.append('g')
                  .call(function(g) {
                      Object.keys(nodeTypesByToolkit).forEach(function(toolkit) {

                          var toolkitGroup = g.append('g').classed('rpd-nodelist-toolkit', true)
                                       .attr('transform', 'translate(0,' + lastY + ')')
                           .call(function(g) {
                                if (toolkitIcons[toolkit]) g.append('text').attr('class', 'rpd-nodelist-toolkit-icon').text(toolkitIcons[toolkit]);
                                g.append('text').attr('class', 'rpd-nodelist-toolkit-name').text(toolkit)
                           });

                          tookitElements[toolkit] = toolkitGroup;

                          lastY += lineHeight;

                          g.append('g').classed('rpd-nodelist-nodetypes', true)
                           .call(function(g) {
                                nodeTypesByToolkit[toolkit].types.forEach(function(nodeTypeDef) {
                                    var nodeType = nodeTypeDef.fullName;
                                    g.append('g').classed('rpd-nodelist-nodetype', true)
                                      .attr('transform', 'translate(0,' + lastY + ')')
                                     .call(function(g) {

                                          var elmData = { def: nodeTypeDef,
                                                          element: g,
                                                          hasDescription: nodeDescriptions[nodeType] ? true : false,
                                                          initialY: lastY };

                                          g.data(elmData);

                                          g.append('text').attr('class', 'rpd-nodelist-icon').text(nodeTypeIcons[nodeType] || ' ')
                                                          .attr('x', (iconWidth / 2)).attr('y', 5);
                                          g.append('text').attr('class', 'rpd-nodelist-fulltypename')
                                                          .attr('transform', 'translate(' + (iconWidth + 4) + ',0)')
                                                          .text(nodeTypeDef.toolkit + '/' + nodeTypeDef.name)
                                          if (nodeDescriptions[nodeType]) {
                                              lastY += lineHeight;
                                              g.append('text').attr('class', 'rpd-nodelist-description')
                                                              .attr('title', nodeDescriptions[nodeType])
                                                              .attr('transform', 'translate(0,' + lineHeight + ')')
                                                              .text(nodeDescriptions[nodeType]);
                                          }

                                          listElements.push(elmData);

                                          listElementsIdxByType[nodeType] = listElements.length - 1;

                                          lastY += lineHeight;

                                      });
                                });
                           });

                      });
                  });

                return listElements;
            },
            recalculateSize: function(listElements) {
                var lastY = 0;

                Object.keys(nodeTypesByToolkit).forEach(function(toolkit) {
                    tookitElements[toolkit].attr('transform', 'translate(0,' + lastY + ')');

                    lastY += lineHeight;

                    var elmDataIdx, elmData;

                    nodeTypesByToolkit[toolkit].types.forEach(function(nodeTypeDef) {
                        elmDataIdx = listElementsIdxByType[nodeTypeDef.fullName];
                        elmData = listElements[elmDataIdx];

                        if (elmData.visible) {
                            elmData.element.attr('transform', 'translate(0,' + lastY + ')');
                            lastY += lineHeight;
                            if (elmData.hasDescription) lastY += lineHeight;
                        }

                    });

                });
            },
            createSearchInput: function() {
                var foElm = svgNode('foreignObject');
                foElm.setAttributeNS(null, 'width', 10);
                foElm.setAttributeNS(null, 'height', 20);
                var input = htmlNode('input');
                input.setAttribute('type', 'text');
                input.style.width = (nodeListSize.width - 40) + 'px';
                foElm.appendChild(input);
                searchGroup.append(foElm);
                return d3.select(input);
            },
            createClearSearchButton: function() {
                return searchGroup.append('text').text('x')
                                  .attr('transform', 'translate(' + (nodeListSize.width - 25) + ',7)');
            },
            clearSearchInput: function(searchInput) { searchInput.node().value = ''; },
            markSelected: function(elmData) { elmData.element.classed('rpd-nodelist-selected', true); },
            markDeselected: function(elmData) { elmData.element.classed('rpd-nodelist-selected', false); },
            markAdding: function(elmData) { elmData.element.classed('rpd-nodelist-add-effect', true); },
            markAdded: function(elmData) { elmData.element.classed('rpd-nodelist-add-effect', false); },
            setVisible: function(elmData) { elmData.element.style('display', 'list-item'); },
            setInvisible: function(elmData) { elmData.element.style('display', 'none'); }
        });

        nodeList.addOnClick();
        nodeList.addSearch();
        nodeList.addCtrlSpaceAndArrows();

    }
});

})();
