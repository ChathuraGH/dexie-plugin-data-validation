/**
 * Dexie Data Validation Plugin
 * Allows defining a validation schema (e.g., using a library like Zod or Joi)
 * and runs validation before any record is created or updated.
 */
export function DataValidationAddon(db, validationSchemas = {}) {
    // A simple mock validator for demonstration purposes
    const mockValidator = (tableName, obj) => {
        const schema = validationSchemas[tableName];
        if (!schema) return true; // No schema, no validation

        // Mock validation logic: ensure 'name' is a string and 'age' is a number > 0
        if (schema.name && typeof obj.name !== 'string') {
            throw new Error(`Validation Error in ${tableName}: 'name' must be a string.`);
        }
        if (schema.age && (typeof obj.age !== 'number' || obj.age <= 0)) {
            throw new Error(`Validation Error in ${tableName}: 'age' must be a positive number.`);
        }

        return true;
    };

    db.tables.forEach(table => {
        // Hook for 'creating' (add/put operations on new objects)
        table.hook('creating', function (primKey, obj, trans) {
            try {
                mockValidator(table.name, obj);
            } catch (e) {
                // Prevent the creation operation from proceeding
                this.onerror = () => {
                    throw e;
                };
            }
        });

        // Hook for 'updating' (modify operations)
        table.hook('updating', function (modifications, primKey, obj, trans) {
            // 'obj' here is the existing object, 'modifications' are the changes.
            // We need to merge them to validate the final state.
            const finalObj = {
                ...obj,
                ...modifications
            };
            try {
                mockValidator(table.name, finalObj);
            } catch (e) {
                // Prevent the update operation from proceeding
                this.onerror = () => {
                    throw e;
                };
            }
        });
    });
}

// Example Usage:
/*
import Dexie from 'dexie';
import { DataValidationAddon } from './dexie-plugin-data-validation.js';

const validationSchemas = {
    users: {
        name: 'string',
        age: 'number'
    }
};

const db = new Dexie('MyDatabase');
db.version(1).stores({
    users: '++id, name, age'
});

db.use(DataValidationAddon, validationSchemas);

// This will succeed:
// await db.users.add({ name: 'Charlie', age: 30 });

// This will fail and throw a validation error:
// await db.users.add({ name: 'David', age: 'twenty' });
*/
