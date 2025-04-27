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

import { isIn, isArray, isString } from '@dwtechs/checkard';
import { deleteProps, add as add$1, chunk, flatten } from '@dwtechs/sparray';
import { log } from '@dwtechs/winstan';
import { Entity } from '@dwtechs/antity';
import Pool from 'pg-pool';

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

function execute$1(query, args, clt) {
    const time = perf.start(query, args);
    const client = clt || pool;
    return client
        .query(query, args)
        .then((res) => {
        deleteIdleProperties(res);
        perf.end(res, time);
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
    res._prebuiltEmptyResultObject = undefined;
}

function quoteIfUppercase(word) {
    if (/[A-Z]/.test(word))
        return `"${word}"`;
    return word;
}

class Select {
    constructor() {
        this._props = [];
        this._cols = "";
        this._count = ", COUNT(*) OVER () AS total";
    }
    addProp(prop) {
        this._props.push(quoteIfUppercase(prop));
        this._cols = this._props.join(", ");
    }
    get props() {
        return this._cols;
    }
    query(table, paginate) {
        const p = paginate ? this._count : '';
        const c = this._cols ? this._cols : '*';
        return `SELECT ${c}${p} FROM "${table}"`;
    }
    execute(query, args, client) {
        return execute$1(query, args, client)
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
}

function $i(qty, start) {
    return `(${Array.from({ length: qty }, (_, i) => `$${start + i + 1}`).join(", ")})`;
}

class Insert {
    constructor() {
        this._props = ["consumerId", "consumerName"];
        this._cols = "*";
        this._nbProps = 2;
    }
    addProp(prop) {
        this._props = add$1(this._props, quoteIfUppercase(prop), this._props.length - 2);
        this._cols = this._props.join(", ");
        this._nbProps++;
    }
    query(table, rows, consumerId, consumerName, rtn = "") {
        let query = `INSERT INTO "${table}" (${this._cols}) VALUES `;
        const args = [];
        let i = 0;
        for (const row of rows) {
            row.consumerId = consumerId;
            row.consumerName = consumerName;
            query += `${$i(this._nbProps, i)}, `;
            for (const prop of this._props) {
                args.push(row[prop]);
            }
            i += this._nbProps;
        }
        query = query.slice(0, -2);
        if (rtn)
            query += ` ${rtn}`;
        return { query, args };
    }
    rtn(prop) {
        return `RETURNING "${prop}"`;
    }
    execute(query, args, client) {
        return execute$1(query, args, client);
    }
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
class Update {
    constructor() {
        this._props = ["consumerId", "consumerName"];
    }
    addProp(prop) {
        this._props = add$1(this._props, quoteIfUppercase(prop), this._props.length - 2);
    }
    query(table, rows, consumerId, consumerName) {
        rows = this.addConsumer(rows, consumerId, consumerName);
        const l = rows.length;
        const args = rows.map(row => row.id);
        let query = `UPDATE "${table}" SET `;
        let i = args.length + 1;
        for (const p of this._props) {
            if (rows[0][p] === undefined)
                continue;
            query += `${p} = CASE `;
            for (let j = 0; j < l; j++) {
                const row = rows[j];
                query += `WHEN id = $${j + 1} THEN $${i++} `;
                args.push(row[p]);
            }
            query += `END, `;
        }
        query = `${query.slice(0, -2)} WHERE id IN ${$i(l, 0)}`;
        return { query, args };
    }
    execute(query, args, client) {
        return __awaiter$2(this, void 0, void 0, function* () {
            return execute$1(query, args, client);
        });
    }
    addConsumer(rows, consumerId, consumerName) {
        return rows.map((row) => (Object.assign(Object.assign({}, row), { consumerId,
            consumerName })));
    }
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
function query(table) {
    return `DELETE FROM "${table}" WHERE "archivedAt" < $1`;
}
function execute(date, query, client) {
    return __awaiter$1(this, void 0, void 0, function* () {
        let db;
        try {
            db = yield execute$1(query, [date], client);
        }
        catch (err) {
            throw err;
        }
        return db;
    });
}

function index(index, matchMode) {
    const i = index.map((i) => `$${i}`);
    switch (matchMode) {
        case "startsWith":
            return `${i}%`;
        case "endsWith":
            return `%${i}`;
        case "contains":
            return `%${i}%`;
        case "notContains":
            return `%${i}%`;
        case "in":
            return `(${i})`;
        default:
            return `${i}`;
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

function add(filters) {
    const conditions = [];
    const args = [];
    if (filters) {
        let i = 1;
        for (const k in filters) {
            const { value, matchMode } = filters[k];
            const indexes = isArray(value) ? value.map(() => i++) : [i++];
            const cond = addOne(k, indexes, matchMode);
            if (cond) {
                conditions.push(cond);
                if (isArray(value))
                    args.push(...value);
                else
                    args.push(value);
            }
        }
    }
    return { conditions, args };
}
function addOne(key, indexes, matchMode) {
    const sqlKey = `${quoteIfUppercase(key)}`;
    const comparator$1 = comparator(matchMode);
    const index$1 = index(indexes, matchMode);
    return comparator$1 ? `${sqlKey} ${comparator$1} ${index$1}` : "";
}

function filter(first, rows, sortField, sortOrder, filters) {
    const { conditions, args } = add(filters);
    const filterClause = where(conditions)
        + orderBy(sortField, sortOrder)
        + limit(rows, first);
    return { filterClause, args };
}
function where(conditions, operator = "AND") {
    if (!conditions.length)
        return "";
    const c = conditions.join(` ${operator} `).trim();
    return ` WHERE ${c}`;
}
function orderBy(sortField, sortOrder) {
    if (!sortField)
        return "";
    const o = sortOrder || "ASC";
    return ` ORDER BY ${quoteIfUppercase(sortField)} ${o}`;
}
function limit(rows, first) {
    return rows ? ` LIMIT ${rows} OFFSET ${first}` : "";
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
class SQLEntity extends Entity {
    constructor(name, properties) {
        super(name, properties);
        this.sel = new Select();
        this.ins = new Insert();
        this.upd = new Update();
        this.query = {
            select: (paginate) => {
                return this.sel.query(this.table, paginate);
            },
            update: (rows, consumerId, consumerName) => {
                return this.upd.query(this.table, rows, consumerId, consumerName);
            },
            insert: (rows, consumerId, consumerName, rtn = "") => {
                return this.ins.query(this.table, rows, consumerId, consumerName, rtn);
            },
            delete: () => {
                return query(this.table);
            },
            return: (prop) => {
                return this.ins.rtn(prop);
            }
        };
        this._table = name;
        for (const p of properties) {
            this.mapProps(p.methods, p.key);
        }
    }
    get table() {
        return this._table;
    }
    set table(table) {
        if (!isString(table, "!0"))
            throw new Error('table must be a string of length > 0');
        this._table = table;
    }
    get(req, res, next) {
        var _a;
        const l = res.locals;
        const b = req.body;
        const first = (_a = b === null || b === void 0 ? void 0 : b.first) !== null && _a !== void 0 ? _a : 0;
        const rows = b.rows || null;
        const sortField = b.sortField || null;
        const sortOrder = b.sortOrder === -1 || b.sortOrder === "DESC" ? "DESC" : "ASC";
        const filters = this.cleanFilters(b.filters) || null;
        const pagination = b.pagination || false;
        const dbClient = l.dbClient || null;
        log.debug(`get(first='${first}', rows='${rows}', 
      sortOrder='${sortOrder}', sortField='${sortField}', 
      pagination=${pagination}, filters=${JSON.stringify(filters)}`);
        const { filterClause, args } = filter(first, rows, sortField, sortOrder, filters);
        const q = this.sel.query(this._table, pagination) + filterClause;
        this.sel.execute(q, args, dbClient)
            .then((r) => {
            l.rows = r.rows;
            l.total = r.total;
            next();
        })
            .catch((err) => next(err));
    }
    add(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const l = res.locals;
            const rows = req.body.rows;
            const dbClient = l.dbClient || null;
            const cId = l.consumerId;
            const cName = l.consumerName;
            log.debug(`addMany(rows=${rows.length}, consumerId=${cId})`);
            const rtn = this.ins.rtn("id");
            const chunks = chunk(rows);
            for (const c of chunks) {
                const { query, args } = this.ins.query(this._table, c, cId, cName, rtn);
                let db;
                try {
                    db = yield execute$1(query, args, dbClient);
                }
                catch (err) {
                    return next(err);
                }
                const r = db.rows;
                for (let i = 0; i < c.length; i++) {
                    c[i].id = r[i].id;
                }
            }
            l.rows = flatten(chunks);
            next();
        });
    }
    update(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const l = res.locals;
            const rows = req.body.rows;
            const dbClient = l.dbClient || null;
            const cId = l.consumerId;
            const cName = l.consumerName;
            log.debug(`update(rows=${rows.length}, consumerId=${cId})`);
            const chunks = chunk(rows);
            for (const c of chunks) {
                const { query, args } = this.upd.query(this._table, c, cId, cName);
                try {
                    yield execute$1(query, args, dbClient);
                }
                catch (err) {
                    return next(err);
                }
            }
            next();
        });
    }
    archive(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            const l = res.locals;
            let rows = req.body.rows;
            const dbClient = l.dbClient || null;
            const cId = l.consumerId;
            const cName = l.consumerName;
            log.debug(`archive(rows=${rows.length}, consumerId=${cId})`);
            rows = rows.map((id) => (Object.assign(Object.assign({}, id), { archived: true })));
            const chunks = chunk(rows);
            for (const c of chunks) {
                const { query, args } = this.upd.query(this._table, c, cId, cName);
                try {
                    yield execute$1(query, args, dbClient);
                }
                catch (err) {
                    return next(err);
                }
            }
            next();
        });
    }
    delete(req, res, next) {
        const date = req.body.date;
        const dbClient = res.locals.dbClient || null;
        log.debug(`delete archived`);
        const q = query(this._table);
        execute(date, q, dbClient)
            .then(() => next())
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
    mapProps(methods, key) {
        for (const m of methods) {
            switch (m) {
                case "GET":
                    this.sel.addProp(key);
                    break;
                case "PATCH":
                    this.upd.addProp(key);
                    break;
                case "PUT":
                    this.upd.addProp(key);
                    break;
                case "POST":
                    this.ins.addProp(key);
                    break;
            }
        }
    }
}

export { SQLEntity, execute$1 as execute, filter };
