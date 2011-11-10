var lmnpopHistory = {
    dbConn : null,
    dbSchema: {
        tables: {
            history:"id         INTEGER PRIMARY KEY AUTOINCREMENT, \
                    title       TEXT, \
                    url         TEXT, \
                    loadpage    BOOL, \
                    embedID     TEXT, \
                    embedHTML   TEXT, \
                    embedWidth  INTEGER, \
                    embedHeight INTEGER"
        }
    },
    
    open : function() {
        if (!this.dbConn) {
            Components.utils.import("resource://gre/modules/Services.jsm");
            Components.utils.import("resource://gre/modules/FileUtils.jsm");

            var dbFile = FileUtils.getFile("ProfD", ["popvideo.sqlite"]);
            if (!dbFile.exists()) {
                this.dbConn = Services.storage.openDatabase(dbFile);
                for(var name in this.dbSchema.tables)
                    this.dbConn.createTable(name, this.dbSchema.tables[name]);
            } else {
                this.dbConn = Services.storage.openDatabase(dbFile);
            }
        }
    },
    
    query : function() {
        var statement = this.dbConn.createStatement("SELECT * FROM history ORDER BY id DESC");
        statement.executeAsync({  
            handleResult: function(aResultSet) {  
                for (let row = aResultSet.getNextRow(); row; row = aResultSet.getNextRow()) {  
                    let title = row.getResultByName("title");
                }  
            },  
  
            handleError: function(aError) {  
                //no op
            },  
  
            handleCompletion: function(aReason) {  
                if (aReason != Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED)  
                    ;//no op
            }  
        }); 
    },
    
    insert : function(values) {
        var statement = this.dbConn.createStatement("INSERT INTO history VALUES(:id,:title,:url,:loadpage,:embedID,:embedHTML,:embedWidth,:embedHeight)");
        for(let p in statement.params){
            statement.params[p] = values[p];
        }
        statement.executeAsync();
    }
    
};

