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
    
    makeSureOpen : function() {
        if (!this.dbConn) {
            Components.utils.import("resource://gre/modules/Services.jsm");
            Components.utils.import("resource://gre/modules/FileUtils.jsm");

            this.dbFile = FileUtils.getFile("ProfD", ["popvideo.sqlite"]);
            if (!this.dbFile.exists()) {
                this.dbConn = Services.storage.openDatabase(this.dbFile);
                for(var name in this.dbSchema.tables)
                    this.dbConn.createTable(name, this.dbSchema.tables[name]);
            } else {
                this.dbConn = Services.storage.openDatabase(this.dbFile);
            }
        }
    },
    
    close : function() {
        if (this.dbConn) {
            this.dbConn.asyncClose();
        }
    },
    
    query : function(callback) {
        this.makeSureOpen();
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
    },
    
    insert : function(values) {
        this.makeSureOpen();
        var statement = this.dbConn.createStatement("INSERT INTO history VALUES(:id,:title,:url,:loadpage,:embedHTML,:embedWidth,:embedHeight)");
        for(let p in statement.params){
            statement.params[p] = values[p];
        }
        statement.executeAsync();
    },
    
    del : function(id) {
        this.makeSureOpen();
        var statement = this.dbConn.createStatement("DELETE FROM history WHERE id= :id");
        statement.params.id = id;
        statement.executeAsync();
    },
    
    clear : function() {
        this.makeSureOpen();
        var statement = this.dbConn.createStatement("DELETE FROM history");
        statement.executeAsync();
    }
};

