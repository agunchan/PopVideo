var lmnpopHistory = {
    changed : true,
    dbFile : null,
    dbConn : null,
    dbSchema: {
        tables: {
            history:"id         INTEGER PRIMARY KEY AUTOINCREMENT, \
                    title       TEXT, \
                    url         TEXT, \
                    loadpage    BOOL, \
                    embedHTML   TEXT, \
                    embedWidth  INTEGER, \
                    embedHeight INTEGER"
        }
    },
    
    open : function() {
        if (!this.dbFile) {
            Components.utils.import("resource://gre/modules/Services.jsm");
            Components.utils.import("resource://gre/modules/FileUtils.jsm");
            this.dbFile = FileUtils.getFile("ProfD", ["popvideo.sqlite"]);
        }

        if (!this.dbFile.exists()) {
            this.dbConn = Services.storage.openDatabase(this.dbFile);
            for(var name in this.dbSchema.tables)
                this.dbConn.createTable(name, this.dbSchema.tables[name]);
        } else {
            this.dbConn = Services.storage.openDatabase(this.dbFile);
        }
    },
    
    close : function(iStorageCompletionCallback) {
        if (this.dbConn) {
            this.dbConn.asyncClose(iStorageCompletionCallback);
        }
    },
    
    query : function(callback) {
        this.open();
        var statement = this.dbConn.createStatement("SELECT * FROM history ORDER BY id DESC LIMIT 10");
        statement.executeAsync({  
            handleResult: function(aResultSet) {  
                for (let row = aResultSet.getNextRow(); row; row = aResultSet.getNextRow()) {  
                    callback(row);
                }
            },
            handleError: function(aError) {
                //no op
            },
            handleCompletion: function(aReason) {
                //on op
            }
        }); 
        statement.finalize();
        this.close();
        this.changed = false;
    },
    
    insert : function(values, callback) {
        this.open();
        var statement = this.dbConn.createStatement("INSERT INTO history VALUES(:id,:title,:url,:loadpage,:embedHTML,:embedWidth,:embedHeight)");
        for(let p in statement.params){
            statement.params[p] = values[p];
        }
        statement.executeAsync({  
            handleResult: function(aResultSet) {  
                //no op
            },
            handleError: function(aError) {
                //no op
            },
            handleCompletion: function(aReason) {
                if (aReason == 0) {
                    let stmt = lmnpopHistory.dbConn.createStatement("SELECT last_insert_rowid() AS id");
                    if (stmt.executeStep()) {
                        callback(stmt.row.id);
                    }
                    stmt.finalize();
                }
            }
        }); 
        statement.finalize();
        this.close();
        this.changed = true;
    },
    
    update : function(values) {
        this.open();
        var statement = this.dbConn.createStatement("UPDATE history SET title=:title,url=:url,embedHTML=:embedHTML WHERE id=:id");
        for(let p in statement.params){
            statement.params[p] = values[p];
        }
        statement.executeAsync();
        statement.finalize();
        this.close();
        this.changed = true;
    },
    
    del : function(id) {
        this.open();
        var statement = this.dbConn.createStatement("DELETE FROM history WHERE id= :id");
        statement.params.id = id;
        statement.executeAsync();
        statement.finalize();
        this.close();
        this.changed = true;
    },
    
    clear : function() {
        try {
            if (this.dbFile.exists()) {
                this.dbFile.remove(false);
                this.dbConn = null;
            }
        } catch(ex) {    
            this.close({  
                complete : function() {  
                    if (lmnpopHistory.dbFile.exists()) {
                        lmnpopHistory.dbFile.remove(false);
                        lmnpopHistory.dbConn = null;
                    }
                }
            });
        }
        this.changed = true;
    }
};

