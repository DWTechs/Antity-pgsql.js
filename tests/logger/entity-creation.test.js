import { SQLEntity } from '../../dist/antity-pgsql.js';

// Mock the logger to capture log output
const mockLogInfo = jest.fn();
const mockLogDebug = jest.fn();

jest.mock('@dwtechs/winstan', () => ({
  log: {
    info: mockLogInfo,
    debug: mockLogDebug
  }
}));

describe('Logger - Entity Creation Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    mockLogInfo.mockClear();
    mockLogDebug.mockClear();
  });

  describe('Basic Entity Creation Logging', () => {
    test('should log entity creation start message', () => {
      const entityName = 'users';
      const properties = [
        {
          key: 'id',
          type: 'number',
          typeCheck: true,
          filter: true,
          operations: ['SELECT', 'DELETE'],
          required: true,
          safe: true
        }
      ];

      new SQLEntity(entityName, properties);

      // Check that creation start message was logged
      expect(mockLogInfo).toHaveBeenCalledWith(
        expect.stringContaining('[Antity-PGSQL] Creating SQLEntity: "users"')
      );
    });

    test('should log comprehensive entity summary after creation', () => {
      const entityName = 'products';
      const properties = [
        {
          key: 'id',
          type: 'number',
          typeCheck: true,
          filter: true,
          operations: ['SELECT', 'DELETE'],
          required: true,
          safe: true
        },
        {
          key: 'name',
          type: 'string',
          min: 2,
          max: 100,
          typeCheck: true,
          filter: true,
          operations: ['SELECT', 'INSERT', 'UPDATE'],
          required: true,
          safe: true
        }
      ];

      new SQLEntity(entityName, properties);

      // Check that entity creation success message was logged
      expect(mockLogInfo).toHaveBeenCalledWith(
        expect.stringContaining('[Antity-PGSQL] Entity "products" created successfully')
      );

      // Check that entity summary was logged
      expect(mockLogInfo).toHaveBeenCalledWith(
        expect.stringContaining('[Antity-PGSQL] Entity Summary:')
      );
    });
  });

  describe('Entity Summary Structure', () => {
    test('should include entity header in summary', () => {
      const entityName = 'orders';
      const properties = [
        {
          key: 'id',
          type: 'number',
          typeCheck: true,
          filter: true,
          operations: ['SELECT'],
          required: true,
          safe: true
        }
      ];

      new SQLEntity(entityName, properties);

      // Find the summary log call
      const summaryCall = mockLogInfo.mock.calls.find(call => 
        call[0].includes('Entity Summary:')
      );
      
      expect(summaryCall).toBeDefined();
      expect(summaryCall[0]).toContain('┌─ SQLEntity: "orders" (Table: orders)');
      expect(summaryCall[0]).toContain('├─ Total Properties: 1');
    });

    test('should include operation distribution in summary', () => {
      const entityName = 'categories';
      const properties = [
        {
          key: 'id',
          type: 'number',
          operations: ['SELECT', 'DELETE'],
          required: true,
          safe: true
        },
        {
          key: 'name',
          type: 'string',
          operations: ['SELECT', 'INSERT', 'UPDATE'],
          required: true,
          safe: true
        }
      ];

      new SQLEntity(entityName, properties);

      const summaryCall = mockLogInfo.mock.calls.find(call => 
        call[0].includes('Entity Summary:')
      );
      
      expect(summaryCall[0]).toContain('├─ Operation Distribution:');
      expect(summaryCall[0]).toContain('SELECT: 2 properties');
      expect(summaryCall[0]).toContain('INSERT: 1 properties');
      expect(summaryCall[0]).toContain('UPDATE: 1 properties');
      expect(summaryCall[0]).toContain('DELETE: 1 properties');
    });

    test('should include detailed property information', () => {
      const entityName = 'users';
      const properties = [
        {
          key: 'email',
          type: 'string',
          min: 5,
          max: 255,
          typeCheck: true,
          filter: true,
          operations: ['SELECT', 'INSERT', 'UPDATE'],
          required: true,
          safe: true
        }
      ];

      new SQLEntity(entityName, properties);

      const summaryCall = mockLogInfo.mock.calls.find(call => 
        call[0].includes('Entity Summary:')
      );
      
      expect(summaryCall[0]).toContain('├─ Property Details:');
      expect(summaryCall[0]).toContain('└─ email:');
      expect(summaryCall[0]).toContain('├─ Type: string');
      expect(summaryCall[0]).toContain('├─ Operations: [SELECT, INSERT, UPDATE]');
      expect(summaryCall[0]).toContain('├─ Required: true');
      expect(summaryCall[0]).toContain('├─ Safe: true');
      expect(summaryCall[0]).toContain('├─ Filterable: true');
      expect(summaryCall[0]).toContain('├─ Constraints: min: 5, max: 255');
      expect(summaryCall[0]).toContain('└─ Validation: enabled');
    });

    test('should include CRUD mappings in summary', () => {
      const entityName = 'posts';
      const properties = [
        {
          key: 'id',
          type: 'number',
          operations: ['SELECT', 'DELETE'],
          required: true,
          safe: true
        },
        {
          key: 'title',
          type: 'string',
          operations: ['SELECT', 'INSERT', 'UPDATE'],
          required: true,
          safe: true
        },
        {
          key: 'content',
          type: 'string',
          operations: ['INSERT', 'UPDATE'],
          required: false,
          safe: true
        }
      ];

      new SQLEntity(entityName, properties);

      const summaryCall = mockLogInfo.mock.calls.find(call => 
        call[0].includes('Entity Summary:')
      );
      
      expect(summaryCall[0]).toContain('├─ CRUD Mappings:');
      expect(summaryCall[0]).toContain('├─ SELECT: [id, title]');
      expect(summaryCall[0]).toContain('├─ INSERT: [title, content]');
      expect(summaryCall[0]).toContain('├─ UPDATE: [title, content]');
      expect(summaryCall[0]).toContain('├─ DELETE: [id]');
    });

    test('should end with completion message', () => {
      const entityName = 'tags';
      const properties = [
        {
          key: 'name',
          type: 'string',
          operations: ['SELECT', 'INSERT'],
          required: true,
          safe: true
        }
      ];

      new SQLEntity(entityName, properties);

      const summaryCall = mockLogInfo.mock.calls.find(call => 
        call[0].includes('Entity Summary:')
      );
      
      expect(summaryCall[0]).toContain('└─ Entity initialization completed');
    });
  });

  describe('Multiple Properties Logging', () => {
    test('should handle entity with multiple properties correctly', () => {
      const entityName = 'customers';
      const properties = [
        {
          key: 'id',
          type: 'number',
          operations: ['SELECT', 'DELETE'],
          required: true,
          safe: true,
          filter: true
        },
        {
          key: 'firstName',
          type: 'string',
          min: 1,
          max: 50,
          operations: ['SELECT', 'INSERT', 'UPDATE'],
          required: true,
          safe: true,
          filter: true
        },
        {
          key: 'lastName',
          type: 'string',
          min: 1,
          max: 50,
          operations: ['SELECT', 'INSERT', 'UPDATE'],
          required: true,
          safe: true,
          filter: true
        },
        {
          key: 'email',
          type: 'string',
          min: 5,
          max: 255,
          operations: ['SELECT', 'INSERT', 'UPDATE'],
          required: true,
          safe: true,
          filter: true
        },
        {
          key: 'createdAt',
          type: 'string',
          operations: ['SELECT', 'INSERT'],
          required: false,
          safe: true,
          filter: false
        }
      ];

      new SQLEntity(entityName, properties);

      // Verify creation messages
      expect(mockLogInfo).toHaveBeenCalledWith(
        expect.stringContaining('[Antity-PGSQL] Creating SQLEntity: "customers"')
      );
      
      expect(mockLogInfo).toHaveBeenCalledWith(
        expect.stringContaining('[Antity-PGSQL] Entity "customers" created successfully')
      );

      // Check summary structure
      const summaryCall = mockLogInfo.mock.calls.find(call => 
        call[0].includes('Entity Summary:')
      );
      
      expect(summaryCall[0]).toContain('├─ Total Properties: 5');
      expect(summaryCall[0]).toContain('SELECT: 5 properties');
      expect(summaryCall[0]).toContain('INSERT: 4 properties');
      expect(summaryCall[0]).toContain('UPDATE: 3 properties');
      expect(summaryCall[0]).toContain('DELETE: 1 properties');
    });
  });

  describe('Edge Cases', () => {
    test('should handle entity with single property', () => {
      const entityName = 'settings';
      const properties = [
        {
          key: 'value',
          type: 'string',
          operations: ['SELECT', 'INSERT', 'UPDATE'],
          required: true,
          safe: true
        }
      ];

      new SQLEntity(entityName, properties);

      expect(mockLogInfo).toHaveBeenCalledTimes(2); // Creation + Summary
      
      const summaryCall = mockLogInfo.mock.calls.find(call => 
        call[0].includes('Entity Summary:')
      );
      
      expect(summaryCall[0]).toContain('├─ Total Properties: 1');
    });

    test('should handle property without constraints', () => {
      const entityName = 'logs';
      const properties = [
        {
          key: 'message',
          type: 'string',
          operations: ['SELECT', 'INSERT'],
          required: false,
          safe: true,
          typeCheck: false
        }
      ];

      new SQLEntity(entityName, properties);

      const summaryCall = mockLogInfo.mock.calls.find(call => 
        call[0].includes('Entity Summary:')
      );
      
      expect(summaryCall[0]).toContain('├─ Required: false');
      expect(summaryCall[0]).toContain('└─ Validation: disabled');
      expect(summaryCall[0]).not.toContain('Constraints:');
    });
  });
});