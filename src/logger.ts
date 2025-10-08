/**
 * Entity logging utilities
 * @file entity-logger.ts
 * @author DWTechs
 */

import { log } from "@dwtechs/winstan";
import { Property } from './property';
import { LOGS_PREFIX } from './constants';


/**
 * Comprehensive logging capabilities
 * 
 * @example Entity Creation Logging
 * When you create a new SQLEntity, you'll see detailed logs like:
 * 
 * ```
 * [Antity-PGSQL] Creating SQLEntity: "users"
 * [Antity-PGSQL] Entity "users" created successfully
 * [Antity-PGSQL] Entity Summary:
 * ┌─ SQLEntity: "users" (Table: users)
 * ├─ Total Properties: 5
 * ├─ Operation Distribution:
 * │  └─ SELECT: 5 properties
 * │  └─ INSERT: 4 properties
 * │  └─ UPDATE: 3 properties
 * ├─ Property Details:
 * │  ├─ id:
 * │  │   ├─ Type: number
 * │  │   ├─ Operations: [SELECT]
 * │  │   ├─ Required: true
 * │  │   ├─ Safe: true
 * │  │   ├─ Filterable: true
 * │  │   └─ Validation: enabled
 * │  ├─ name:
 * │  │   ├─ Type: string
 * │  │   ├─ Operations: [SELECT, INSERT, UPDATE]
 * │  │   ├─ Required: true
 * │  │   ├─ Safe: true
 * │  │   ├─ Filterable: true
 * │  │   ├─ Constraints: min: 2, max: 100
 * │  │   └─ Validation: enabled
 * │  ├─ email:
 * │  │   ├─ Type: string
 * │  │   ├─ Operations: [SELECT, INSERT, UPDATE]
 * │  │   ├─ Required: true
 * │  │   ├─ Safe: true
 * │  │   ├─ Filterable: true
 * │  │   ├─ Constraints: min: 5, max: 255
 * │  │   └─ Validation: enabled
 * │  ├─ created_at:
 * │  │   ├─ Type: date
 * │  │   ├─ Operations: [SELECT, INSERT]
 * │  │   ├─ Required: true
 * │  │   ├─ Safe: false
 * │  │   ├─ Filterable: false
 * │  │   └─ Validation: enabled
 * │  └─ updated_at:
 * │      ├─ Type: date
 * │      ├─ Operations: [SELECT, UPDATE]
 * │      ├─ Required: false
 * │      ├─ Safe: false
 * │      ├─ Filterable: false
 * │      └─ Validation: enabled
 * ├─ CRUD Mappings:
 * │  ├─ SELECT: [id, name, email, created_at, updated_at]
 * │  ├─ INSERT: [name, email, created_at, updated_at]
 * │  ├─ UPDATE: [name, email, updated_at]
 * │  └─ DELETE: []
 * └─ Entity initialization completed
 * ```

 * 
 * Logs a comprehensive summary of the created entity
 * @param {string} name - Entity name
 * @param {string} table - Table name
 * @param {Property[]} properties - Array of entity properties
 */
export function logSummary(name: string, table: string, properties: Property[]): void {
  const summary = generateSummary(name, table, properties);
  log.info(`${LOGS_PREFIX}Entity "${name}" created successfully`);
  log.info(`${LOGS_PREFIX}Entity Summary:\n${summary}`);
}

/**
 * Generates a detailed summary of the entity configuration
 * @param {string} name - Entity name
 * @param {string} table - Table name
 * @param {Property[]} properties - Array of entity properties
 * @returns {string} Formatted entity summary
 */
function generateSummary(name: string, table: string, properties: Property[]): string {
    const lines: string[] = [];
    const propLen = properties.length;
    // Header
    lines.push(`┌─ SQLEntity: "${name}" (Table: ${table})`);
    lines.push(`├─ Total Properties: ${propLen}`);
    
    // Operation statistics
    const operationStats = getOperationStatistics(properties);
    lines.push(`├─ Operation Distribution:`);
    Object.entries(operationStats).forEach(([op, count]) => {
      lines.push(`│  └─ ${op}: ${count} properties`);
    });
    
    // Property details
    lines.push(`├─ Property Details:`);
    properties.forEach((p, index) => {
      const isLast = index === propLen - 1;
      const prefix = isLast ? '└─' : '├─';
      
      lines.push(`│  ${prefix} ${p.key}:`);
      lines.push(`│  ${isLast ? ' ' : '│'}   ├─ Type: ${p.type}`);
      lines.push(`│  ${isLast ? ' ' : '│'}   ├─ Min: ${p.min}`);
      lines.push(`│  ${isLast ? ' ' : '│'}   ├─ Max: ${p.max}`);
      lines.push(`│  ${isLast ? ' ' : '│'}   ├─ Required: ${p.required}`);
      lines.push(`│  ${isLast ? ' ' : '│'}   ├─ Safe: ${p.safe}`);
      lines.push(`│  ${isLast ? ' ' : '│'}   ├─ TypeCheck: ${p.typeCheck}`);
      lines.push(`│  ${isLast ? ' ' : '│'}   ├─ Filter: ${p.filter}`);
      lines.push(`│  ${isLast ? ' ' : '│'}   ├─ Methods: [${p.methods.join(', ')}]`);
      lines.push(`│  ${isLast ? ' ' : '│'}   ├─ Operations: [${p.operations.join(', ')}]`);
      lines.push(`│  ${isLast ? ' ' : '│'}   ├─ Sanitize: ${p.sanitize}`);
      lines.push(`│  ${isLast ? ' ' : '│'}   ├─ Normalize: ${p.normalize}`);
      lines.push(`│  ${isLast ? ' ' : '│'}   ├─ Validate: ${p.validate}`);
      
    });
    
    // CRUD operation mappings
    const crudMappings = getCrudMappings(properties);
    lines.push(`├─ CRUD Mappings:`);
    Object.entries(crudMappings).forEach(([operation, props]) => {
      lines.push(`│  ├─ ${operation}: [${props.join(', ')}]`);
    });
    
    lines.push(`└─ Entity initialization completed`);
    
    return lines.join('\n');
  }

/**
 * Calculates statistics for each operation type
 * @param {Property[]} properties - Array of entity properties
 * @returns {Record<string, number>} Operation statistics
 */
function getOperationStatistics(properties: Property[]): Record<string, number> {
    const stats: Record<string, number> = {};
    
    properties.forEach(prop => {
      prop.operations.forEach(op => {
        stats[op] = (stats[op] || 0) + 1;
      });
    });
    
    return stats;
  }

/**
 * Gets CRUD operation mappings for properties
 * @param {Property[]} properties - Array of entity properties
 * @returns {Record<string, string[]>} CRUD mappings
 */
function getCrudMappings(properties: Property[]): Record<string, string[]> {
    const mappings: Record<string, string[]> = {
      'SELECT': [],
      'INSERT': [],
      'UPDATE': [],
      'DELETE': []
    };
    
    properties.forEach(prop => {
      const p = prop as any; // Type assertion to access base class properties
      prop.operations.forEach(op => {
        if (mappings[op]) {
          mappings[op].push(p.key);
        }
      });
    });
    
    return mappings;
  }

/**
 * Gets entity statistics
 * @param {string} name - Entity name
 * @param {string} table - Table name  
 * @param {Property[]} properties - Array of entity properties
 * @returns {object} Entity statistics
 */
export function getStats(name: string, table: string, properties: Property[]): {
  name: string;
  table: string;
  totalProperties: number;
  operationDistribution: Record<string, number>;
  crudMappings: Record<string, string[]>;
} {
  return {
    name: name,
    table: table,
    totalProperties: properties.length,
    operationDistribution: getOperationStatistics(properties),
    crudMappings: getCrudMappings(properties)
  };
}