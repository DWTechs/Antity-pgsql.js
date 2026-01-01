
# 0.7.0 (Jan 1st 2026)

- Rename delete() method to deleteArchive() for deleting archived rows before a specific date
- Add new delete() method that deletes rows by their IDs using a single database request
- Add query.delete(ids: number[]) method that generates DELETE queries using PostgreSQL's ANY operator
- Add query.deleteArchive() method that generates DELETE queries for archived rows

# 0.6.2 (Dec 31st 2025)

- Fix INSERT RETURNING clause to properly apply quoting logic for property names with uppercase letters or reserved keywords

# 0.6.1 (Dec 27th 2025)

- Fix UPDATE query to properly apply quoting logic to fields that contain uppercase letters

# 0.6.0 (Dec 20th 2025)

- Update dependencies : 
  - "@dwtechs/antity": "0.14.0"

# 0.5.1 (Dec 14th 2025)

- Fix INSERT query bug where property values were null due to accessing row data with quoted property names instead of original names

# 0.5.0 (Dec 13th 2025)

- Make consumerId and consumerName optional parameters in INSERT and UPDATE operations
- Fix declaration file for query.select() function

# 0.4.0 (Sep 26th 2025)
  
- Add filter property to make a property filterable in SELECT operations
- Add Operations property to list SQL DML operations available for the property
- Enhance usability with automatic summary logging during entity creation with tree-structured entity summary output showing properties, operations, and CRUD mappings
- Update query.select() method to support filtering instead of creating filters externally. 
- Update dependencies : 
  - "@dwtechs/antity": "0.13.0"
  - "@dwtechs/winstan": "0.5.0"
  - "@dwtechs/checkard": "3.6.0"

# 0.3.4 (Sep 10th 2025)
  
- Update dependencies : 
  - "@dwtechs/checkard": "3.5.1",
  - "@dwtechs/antity": "0.11.2",
  - "@dwtechs/sparray": "0.2.1",


# 0.3.3 (Aug 16th 2025)

- Improved error handling in entity operations
- Update Antity.js to version 0.11.1


# 0.3.2 (May 2nd 2025)

- Upgrade @dwtechs/antity dependency to 0.10.0


# 0.3.1 (May 1st 2025)

- Upgrade @dwtechs/antity dependency to 0.9.2


# 0.3.0 (Apr 27th 2025)

- Enhance quote handling for reserved keywords


# 0.2.1 (Apr 26th 2025)

- Add proper quote handling for table names


# 0.2.0 (Apr 25th 2025)

- Add execute() method to the library
- Add quotes around property names with uppercases


# 0.1.1 (Apr 24th 2025)

- fix package.json file


# 0.1.0 (Apr 23th 2025)

- initial release
