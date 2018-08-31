var mongodb = require('./db');
markdown = require('markdown').markdown;

function Post(name,title,post){
    this.name=name;
    this.title=title;
    this.post=post;
}

module.exports=Post;

Post.prototype.save=function(callback){
    var date=new Date();
    var time={
        date:date,
        year:date.getFullYear(),
        month:date.getFullYear()+"-"+(date.getMonth()+1),
        day:date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
        minute:date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + 
        date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) 
    }
    var post={
        name:this.name,
        time:time,
        title:this.title,
        post:this.post,
        comments:[]
    }
    mongodb.open(function(err,db){
        if(err){
            return callback(err)
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err)
            }
            collection.insert(post,{safe:true},function(err){
                mongodb.close()
                if(err){return callback(err)}
                callback(null)
            })
        })
    })
}
Post.getAll=function(name,callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err)
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err)
            }
            var query={};
            if(name){
                query.name=name;
            }
            collection.find(query).sort({tiem:-1}).toArray(function(err,docs){
                mongodb.close();
                if(err){
                    return callback(err)
                }
                docs.forEach(function(doc){
                    console.log('mark')
                    doc.post=markdown.toHTML(doc.post)
                })
                callback(null,docs)
            })
        })
    })
} //传入参数name，获取一个人的所有文章；不传入参数，获取所有文章
Post.getOne=function(name,day,title,callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err)
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close();
                return callbcak(err)
            }
            collection.findOne({
                'name':name,
                'title':title,
                'time.day':day
            },function(err,doc){
                mongodb.close()
                if(err){return callback(err)}
                if (doc) {
                    console.log(doc)
                    doc.post = markdown.toHTML(doc.post);
                    doc.comments.forEach(function (comment) {
                      comment.content = markdown.toHTML(comment.content);
                    });
                  }
                callback(null,doc)
            })
        })
    })
} //根据用户名、发表时间、文章名精确的获取一个文章
Post.edit=function(name,day,title,callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err)
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close()
                return callback(err)
            }
            collection.findOne({
                "name":name,
                "title":title,
                "time.day":day,
            },function(err,doc){
                mongodb.close()
                if(err){
                    return callback(err)
                }
                //doc.post=markdown.toHTML(doc.post)
                callback(null,doc)
            })
        })
    })
}
Post.update=function(name,day,title,post,callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err)
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close()
                return callback(err)
            }
            console.log('b2')
            collection.update({
                "name":name,
                "time.day":day,
                "title":title
            },{
                $set:{post:post}
            },function(err){
                mongodb.close()
                if(err){
                    return callback(err)
                }
                callback(null)
            })
        })
    })
}
Post.remove=function(name,day,title,callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err)
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close()
                return callback(err)
            }
            collection.remove({
                "name":name,
                "time.day":day,
                "title":title
            },{
                w:1
            },function(err){
                mongodb.close()
                if(err){
                    return callback(err)
                }
                callback(null)
            })
        })
    })
}