import { SQLEntity } from '../dist/antity-pgsql.js';

describe('SQLEntity.get', () => {
    let mockReq, mockRes, mockNext, sqlEntity;

    beforeEach(() => {
        mockReq = {
            body: {
                first: 0,
                rows: 10,
                sortField: 'name',
                sortOrder: 'ASC',
                filters: { name: { value: 'John', matchMode: 'startsWith' } },
                pagination: true,
            },
        };

        mockRes = {
            locals: {},
        };

        mockNext = jest.fn();

        sqlEntity = new SQLEntity('TestEntity', [
            { key: 'name', methods: ['GET'], type: 'string' },
            { key: 'age', methods: ['GET'], type: 'number' },
        ], 'test_table');
    });

    it('should fetch rows and set them in res.locals', async () => {
        const mockSelect = jest.fn().mockResolvedValue({
            rows: [{ id: 1, name: 'John Doe', age: 30 }],
            total: 1,
        });

        sqlEntity.table = 'test_table';

        // Mock the select function
        jest.spyOn(sqlEntity, 'get').mockImplementation(() => mockSelect);

        await sqlEntity.get(mockReq, mockRes, mockNext);

        expect(mockSelect).toHaveBeenCalledWith(
            'id, name, age',
            'test_table',
            0,
            10,
            'name',
            'ASC',
            mockReq.body.filters
        );
        expect(mockRes.locals.rows).toEqual([{ id: 1, name: 'John Doe', age: 30 }]);
        expect(mockRes.locals.total).toBe(1);
        expect(mockNext).toHaveBeenCalled();
    });

    it('should call next with an error if select fails', async () => {
        const mockError = new Error('Database error');
        const mockSelect = jest.fn().mockRejectedValue(mockError);

        sqlEntity.getColsByOp = jest.fn().mockReturnValue('id, name, age');
        sqlEntity.cleanFilters = jest.fn().mockReturnValue(mockReq.body.filters);
        sqlEntity._table = 'test_table';

        // Mock the select function
        jest.spyOn(sqlEntity, 'get').mockImplementation(() => mockSelect);

        await sqlEntity.get(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalledWith(mockError);
    });
});