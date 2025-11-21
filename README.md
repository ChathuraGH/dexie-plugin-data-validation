# Dexie Data Validation Plugin

This plugin enforces data integrity by running a validation check before any record is created or updated in the database. It prevents invalid data from ever reaching the IndexedDB store.

## Features

*   **Pre-Write Validation:** Validation runs on the `creating` and `updating` hooks, ensuring data is valid before the transaction commits.
*   **Transaction Abort:** If validation fails, the transaction is aborted, and an error is thrown, preventing the write operation.
*   **Customizable Schemas:** Accepts a map of validation schemas (one per table) defined by the user.

## Usage

1.  **Define Schemas:** Create a map of schemas. For this example, a simple mock validator is used, but in a real application, you would integrate a library like [Zod](https://zod.dev/) or [Joi](https://joi.dev/).

    \`\`\`javascript
    const validationSchemas = {
        users: {
            name: 'string', // Requires 'name' to be a string
            age: 'number'   // Requires 'age' to be a positive number
        }
    };
    \`\`\`

2.  **Register Plugin:** Pass the schema map as the second argument to `db.use()`.

    \`\`\`javascript
    import { DataValidationAddon } from './dexie-plugin-data-validation.js';

    db.use(DataValidationAddon, validationSchemas);
    \`\`\`

3.  **Example (Success and Failure):**

    \`\`\`javascript
    // This will succeed:
    await db.users.add({ name: 'Charlie', age: 30 });

    // This will fail and throw a Validation Error, aborting the transaction:
    try {
        await db.users.add({ name: 'David', age: 'twenty' });
    } catch (error) {
        console.error(error.message); // Output: "Validation Error in users: 'age' must be a positive number."
    }
    \`\`\`

## Implementation Details

The plugin uses Dexie's powerful **`creating`** and **`updating`** hooks.

*   Inside the hook, the provided data is passed to the validation function.
*   If the validation function throws an error, the hook's context is used to set the `onerror` handler: `this.onerror = () => { throw e; };`. This ensures the error is propagated and the entire IndexedDB transaction is aborted, maintaining data consistency.
\`\`\`
