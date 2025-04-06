/*
MIT License

Copyright (c) 2025 DWTechs

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

https://github.com/DWTechs/Antity-pgsql.js
*/

import { isIn, isString } from '@dwtechs/checkard';
import { log } from '@dwtechs/winstan';
import { Entity } from '@dwtechs/antity';
import { deleteProps, chunk, flatten } from '@dwtechs/sparray';
import Pool from 'pg-pool';

function index(i, matchMode) {
    switch (matchMode) {
        case "startsWith":
            return `$${i}%`;
        case "endsWith":
            return `%$${i}`;
        case "contains":
            return `%$${i}%`;
        case "notContains":
            return `%$${i}%`;
        default:
            return `$${i}`;
    }
}
function comparator(matchMode) {
    switch (matchMode) {
        case "startsWith":
            return "LIKE";
        case "endsWith":
            return "LIKE";
        case "contains":
            return "LIKE";
        case "notContains":
            return "NOT LIKE";
        case "equals":
            return "=";
        case "notEquals":
            return "<>";
        case "in":
            return "IN";
        case "lt":
            return "<";
        case "lte":
            return "<=";
        case "gt":
            return ">";
        case "gte":
            return ">=";
        case "is":
            return "IS";
        case "isNot":
            return "IS NOT";
        case "before":
            return "<";
        case "after":
            return ">";
        default:
            return null;
    }
}
function type(type) {
    const s = "string";
    const n = "number";
    const d = "date";
    switch (type) {
        case "integer":
            return n;
        case "float":
            return n;
        case "even":
            return n;
        case "odd":
            return n;
        case "positive":
            return n;
        case "negative":
            return n;
        case "powerOfTwo":
            return n;
        case "ascii":
            return n;
        case "jwt":
            return s;
        case "symbol":
            return s;
        case "email":
            return s;
        case "regex":
            return s;
        case "ipAddress":
            return s;
        case "slug":
            return s;
        case "hexadecimal":
            return s;
        case "date":
            return d;
        case "timestamp":
            return d;
        case "function":
            return s;
        case "htmlElement":
            return s;
        case "htmlEventAttribute":
            return s;
        case "node":
            return s;
        case "json":
            return s;
        case "object":
            return s;
        default:
            return s;
    }
}
function method(method) {
    switch (method) {
        case "GET":
            return "SELECT";
        case "PATCH":
            return "UPDATE";
        case "PUT":
            return "UPDATE";
        case "POST":
            return "INSERT";
        case "DELETE":
            return "DELETE";
        default:
            return undefined;
    }
}

const matchModes = {
    string: ["startsWith", "contains", "endsWith", "notContains", "equals", "notEquals", "lt", "lte", "gt", "gte"],
    number: ["equals", "notEquals", "lt", "lte", "gt", "gte"],
    date: ["is", "isNot", "dateAfter"],
};
function matchMode(type, matchMode) {
    return isIn(matchModes[type], matchMode);
}

const { DB_HOST, DB_USER, DB_PWD, DB_NAME, DB_PORT, DB_MAX } = process.env;
var pool = new Pool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PWD,
    database: DB_NAME,
    port: +(DB_PORT || 5432),
    max: DB_MAX ? +DB_MAX : 10,
});

function start(query, args) {
    const a = JSON.stringify(args);
    const q = query.replace(/[\n\r]+/g, "").replace(/\s{2,}/g, " ");
    log.debug(`Pgsql: { Query : '${q}', Args : '${a}' }`);
    return Date.now();
}
function end(res, time) {
    const r = JSON.stringify(res);
    const t = Date.now() - time;
    log.debug(`Pgsql response in ${t}ms : ${r}`);
}
var perf = {
    start,
    end,
};

function execute(query, args, clt) {
    const time = perf.start(query, args);
    const client = clt || pool;
    return client
        .query(query, args)
        .then((res) => {
        perf.end(res, time);
        deleteIdleProperties(res);
        return res;
    })
        .catch((err) => {
        err.msg = `Postgre error: ${err.message}`;
        throw err;
    });
}
function deleteIdleProperties(res) {
    res.command = undefined;
    res.oid = undefined;
    res.fields = undefined;
    res._parsers = undefined;
    res._types = undefined;
    res.RowCtor = undefined;
    res.rowAsArray = undefined;
}

function add(filters) {
    const conditions = [];
    const args = [];
    if (filters) {
        let i = 1;
        for (const k in filters) {
            const { value, matchMode } = filters[k];
            conditions.push(addOne(k, i, matchMode));
            args.push(value);
            i++;
        }
    }
    return { conditions, args };
}
function addOne(key, index$1, matchMode) {
    const sqlKey = `\"${key}\"`;
    const comparator$1 = comparator(matchMode);
    const mappedIndex = index(index$1, matchMode);
    return `${sqlKey} ${comparator$1} ${mappedIndex}`;
}

function filter(first, rows, sortField, sortOrder, filters) {
    const { conditions, args } = add(filters);
    const filterClause = where(conditions)
        + orderBy(sortField, sortOrder)
        + limit(rows, first);
    return { filterClause, args };
}
function where(conditions, operator = "AND") {
    const c = conditions.join(` ${operator} `).trim();
    return conditions ? ` WHERE ${c}` : "";
}
function orderBy(sortField, sortOrder) {
    if (!sortField)
        return "";
    return ` ORDER BY "${sortField}" ${sortOrder}`;
}
function limit(rows, first) {
    return rows ? ` LIMIT ${rows} OFFSET ${first}` : "";
}

function select(cols, table, first, rows, sortField, sortOrder, filters) {
    const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);
    const query = `SELECT ${cols} FROM ${table} ${filterClause}`;
    return execute(query, args, null)
        .then((r) => {
        if (!r.rowCount)
            throw { status: 404, msg: "Resource not found" };
        const f = r.rows[0];
        if (f.total) {
            r.total = Number(f.total);
            r.rows = deleteProps(r.rows, ["total"]);
        }
        return r;
    });
}

var __awaiter$2 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function insert(rows, table, cols, rtn, consumerId, consumerName, client) {
    return __awaiter$2(this, void 0, void 0, function* () {
        const chunks = chunk(rows);
        const q = `INSERT INTO "${table}" (${cols}) VALUES `;
        const rq = ` RETURNING ${rtn}` ;
        for (const c of chunks) {
            let values = "";
            const args = [];
            for (const row of c) {
                values += `${$i(row.length + 2)}, `;
                args.push(...row, consumerId, consumerName);
            }
            values = `${values.slice(0, -2)}`;
            let db;
            const query = `${q}${values}${rq}`;
            try {
                db = yield execute(query, args, client);
            }
            catch (err) {
                throw err;
            }
            const r = db.rows;
            for (let i = 0; i < c.length; i++) {
                c[i] = r[i].id;
            }
        }
        return flatten(chunks);
    });
}
function $i(qty) {
    return `(${Array.from({ length: qty }, (_, i) => `$${i + 1}`).join(", ")})`;
}

var __awaiter$1 = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function update(rows, table, cols, consumerId, consumerName, client) {
    return __awaiter$1(this, void 0, void 0, function* () {
        rows = addConsumer(rows, consumerId, consumerName);
        const chunks = chunk(rows);
        let q = `UPDATE "${table}" `;
        let i = 0;
        for (const c of chunks) {
            let v = "SET ";
            const args = [];
            for (const p of cols) {
                v += `${p} = CASE `;
                for (const row of c) {
                    v += `WHEN id = ${i++} THEN $${i++} `;
                    args.push(row.id, row[p]);
                }
                v += `END, `;
            }
            q += `${v.slice(0, -2)} WHERE id IN ${extractIds(c)}`;
            try {
                yield execute(q, args, client);
            }
            catch (err) {
                throw err;
            }
        }
    });
}
function addConsumer(rows, consumerId, consumerName) {
    return rows.map((row) => (Object.assign(Object.assign({}, row), { consumerId,
        consumerName })));
}
function extractIds(chunk) {
    const ids = chunk.map(row => row.id);
    return `(${ids.join(",")})`;
}

var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function del(date, table, client) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = `DELETE FROM "${table}" WHERE "archivedAt" < $1`;
        let db;
        try {
            db = yield execute(query, [date], client);
        }
        catch (err) {
            throw err;
        }
        return db;
    });
}

class SQLEntity extends Entity {
    constructor(name, properties, table) {
        super(name, properties);
        this._cols = {
            SELECT: [],
            INSERT: [],
            UPDATE: [],
            DELETE: []
        };
        this._table = table;
        for (const p of properties) {
            for (const m of p.methods) {
                const o = method(m);
                if (o)
                    this._cols[o].push(p.key);
            }
        }
        this._cols.INSERT.push("consumerId", "consumerName");
        this._cols.UPDATE.push("consumerId", "consumerName");
        this._cols.DELETE.push("consumerId", "consumerName");
    }
    get table() {
        return this._table;
    }
    get cols() {
        return this._cols;
    }
    set table(table) {
        if (!isString(table, "!0"))
            throw new Error('table must be a string of length > 0');
        this._table = table;
    }
    getColsByOp(operation, stringify, pagination) {
        const cols = pagination && operation === "SELECT"
            ? [...this._cols[operation], "COUNT(*) OVER () AS total"]
            : this.cols[operation];
        return stringify ? cols.join(', ') : cols;
    }
    get(req, res, next) {
        var _a;
        const rb = req.body;
        const first = (_a = rb === null || rb === void 0 ? void 0 : rb.first) !== null && _a !== void 0 ? _a : 0;
        const rows = rb.rows || null;
        const sortField = rb.sortField || null;
        const sortOrder = rb.sortOrder === -1 || rb.sortOrder === "DESC" ? "DESC" : "ASC";
        const filters = this.cleanFilters(rb.filters) || null;
        const pagination = rb.pagination || false;
        const operation = "SELECT";
        log.debug(`get(first='${first}', rows='${rows}', 
      sortOrder='${sortOrder}', sortField='${sortField}', 
      pagination=${pagination}, filters=${JSON.stringify(filters)}`);
        const cols = this.getColsByOp(operation, true, pagination);
        select(cols, this._table, first, rows, sortField, sortOrder, filters).then((r) => {
            res.locals.rows = r.rows;
            res.locals.total = r.total;
            next();
        })
            .catch((err) => next(err));
    }
    add(req, res, next) {
        const rows = req.body.rows;
        const dbClient = res.locals.dbClient || null;
        const consumerId = res.locals.consumerId;
        const consumerName = res.locals.consumerName;
        const operation = "INSERT";
        log.debug(`addMany(rows=${req.body.rows.length}, consumerId=${consumerId})`);
        const cols = this.getColsByOp(operation, true, false);
        insert(rows, this._table, cols, "id", consumerId, consumerName, dbClient).then((r) => {
            res.locals.rows = r;
            next();
        })
            .catch((err) => next(err));
    }
    update(req, res, next) {
        const rows = req.body.rows;
        const dbClient = res.locals.dbClient || null;
        const consumerId = res.locals.consumerId;
        const consumerName = res.locals.consumerName;
        const operation = "UPDATE";
        log.debug(`update ${rows.length} rows`);
        const cols = this.getColsByOp(operation, false, false);
        update(rows, this._table, cols, consumerId, consumerName, dbClient).then(() => next())
            .catch((err) => next(err));
    }
    archive(req, res, next) {
        let rows = req.body.rows;
        const dbClient = res.locals.dbClient || null;
        const consumerId = res.locals.consumerId;
        const consumerName = res.locals.consumerName;
        log.debug(`archive ${rows.length} rows`);
        rows = rows.map((row) => (Object.assign(Object.assign({}, row), { archived: true })));
        const cols = ["archived", "consumerId", "consumerName"];
        update(rows, this._table, cols, consumerId, consumerName, dbClient).then(() => next())
            .catch((err) => next(err));
    }
    delete(req, res, next) {
        const date = req.body.date;
        const dbClient = res.locals.dbClient || null;
        log.debug(`delete archived`);
        del(date, this._table, dbClient).then(() => next())
            .catch((err) => next(err));
    }
    cleanFilters(filters) {
        for (const k in filters) {
            if (filters.hasOwnProperty(k)) {
                const prop = this.getProp(k);
                if (!prop) {
                    log.warn(`Filters: skipping unknown property: ${k}`);
                    delete filters[k];
                    continue;
                }
                const type$1 = type(prop.type);
                const { matchMode: matchMode$1 } = filters[k];
                if (!matchMode$1 || !matchMode(type$1, matchMode$1)) {
                    log.warn(`Filters: skipping invalid match mode: "${matchMode$1}" for type: "${type$1}" at property: "${k}"`);
                    delete filters[k];
                    continue;
                }
            }
        }
        return filters;
    }
}

export { SQLEntity };
