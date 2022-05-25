var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
const { DataTypes } = require("sequelize");
const { withFilter } = require("graphql-subscriptions");
const interpreterService = require("../services/interpreterService");
const { gridSideLength } = require("./world");
const typeDefs = `
  type Query {
    node(id: ID!): Node!
  }

  type Mutation {
    createNode(worldId: ID!, pos: [Int!]!): Node!
    updateNodeContent(id: ID!, content: String!): Node!
  }

  type Subscription {
    nodeCreated(worldId: ID!): World!
  }

  type Node {
    id: ID!
    content: String!
    result: String
    blocks: String
    pos: [Int!]!
  }
`;
const define = (sequelize) => sequelize.define("node", {
  content: {
    type: DataTypes.STRING(4096),
    allowNull: false,
    defaultValue: ""
  },
  pos: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    allowNull: false
  }
});
const resolvers = (models, pubsub) => ({
  Query: {
    node: async (parent, args) => {
      const { id } = args;
      return await models.node.findOne({ where: { id } });
    }
  },
  Mutation: {
    createNode: async (parent, args) => {
      const { worldId, pos } = args;
      const scriptNode = await models.node.create({ worldId, pos });
      const world = await models.world.findOne({ where: { id: worldId } });
      const grid = world.toJSON().grid;
      const index = pos[0] + gridSideLength * pos[1];
      grid[index] = [scriptNode.id, 50];
      let updatedWorld = await models.world.update({ grid }, { where: { id: worldId }, returning: true, plain: true });
      updatedWorld = updatedWorld[1].toJSON();
      pubsub.publish("NODE_CREATED", { nodeCreated: updatedWorld });
      return scriptNode.toJSON();
    },
    updateNodeContent: async (parent, args) => {
      const { id, content } = args;
      const { result } = await interpreterService.interpretGen(content);
      console.log(result);
      const scriptNode = await models.node.update({ content }, { where: { id }, returning: true, plain: true });
      const n = scriptNode[1].toJSON();
      const blocks = result.blocks;
      const world = await models.world.findOne({ where: { id: n.worldId } });
      const grid = world.toJSON().grid;
      let blocksObj = {};
      blocks.forEach((block) => {
        const x = n.pos[0] + block.x;
        const y = n.pos[1] - block.y;
        const index = x + gridSideLength * y;
        blocksObj[index] = [n.id, 5];
      });
      grid.forEach((el, i) => {
        if (el[0] === n.id && el[1] !== 50) {
          grid[i] = [0, 0];
        }
      });
      grid.forEach((el, i) => {
        let b = blocksObj[i];
        if (!!b) {
          grid[i] = b;
        }
      });
      await models.world.update({ grid }, { where: { id: n.worldId } });
      return __spreadProps(__spreadValues({}, n), { result: result.result, blocks: JSON.stringify(result.blocks) });
    }
  },
  Subscription: {
    nodeCreated: {
      subscribe: withFilter(() => pubsub.asyncIterator(["NODE_CREATED"]), (payload, variables) => {
        const isSpecificWorld = payload.nodeCreated.id == variables.worldId;
        return isSpecificWorld;
      })
    }
  }
});
module.exports = { typeDefs, define, resolvers };
//# sourceMappingURL=node.js.map
