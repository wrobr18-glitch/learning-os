import neo4j, { Driver } from "neo4j-driver";

const uri = process.env.NEO4J_URI || "";
const user = process.env.NEO4J_USERNAME || "neo4j";
const password = process.env.NEO4J_PASSWORD || "";

let driver: Driver | null = null;

export const getNeo4jDriver = (): Driver => {
  if (!driver) {
    if (!uri || !password) {
      throw new Error("Missing NEO4J_URI or NEO4J_PASSWORD environment variables.");
    }
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  }
  return driver;
};

export const closeNeo4jDriver = async () => {
  if (driver) {
    await driver.close();
    driver = null;
  }
};

export * from "./parser";
export * from "./extractor";
export * from "./context-builder";
