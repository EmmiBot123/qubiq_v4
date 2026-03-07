/**
 * PyBlocks - MySQL Connector Mock for Skulpt
 * This script injects a fake mysql.connector module into Skulpt's builtin files.
 */

(function () {
    if (typeof Sk !== 'undefined') {
        const mysqlConnectorCode = `
class MySQLCursor:
    def __init__(self, connection):
        self.connection = connection
    
    def execute(self, query):
        print(f"Executing SQL Query: {query}")
    
    def fetchall(self):
        print("Mock: Fetching all results")
        return []

class MySQLConnection:
    def __init__(self, host, user, password, database):
        self.host = host
        self.user = user
        self.password = password
        self.database = database
        print(f"Connected to MySQL database '{database}' on '{host}' as '{user}'")

    def cursor(self):
        return MySQLCursor(self)
    
    def close(self):
        print("Connection closed")

def connect(host='localhost', user='', password='', database=''):
    return MySQLConnection(host, user, password, database)
`;

        // Inject into Skulpt's internal file system
        Sk.builtinFiles = Sk.builtinFiles || { "files": {} };

        function addMock(path, code) {
            Sk.builtinFiles["files"][path] = code;
            Sk.builtinFiles["files"]["src/lib/" + path] = code;
        }

        addMock("mysql/__init__.py", "");
        addMock("mysql/connector.py", mysqlConnectorCode);
    }
})();
