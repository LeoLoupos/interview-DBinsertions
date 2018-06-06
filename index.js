const http = require('http')
const port = process.env.PORT;

//fs for file utils
var fs = require("fs");
//postgre package for node
var pg = require('pg');    
//env variable for our database_url
var conString = process.env.POSTGRE_DATABASE_URL;
//create a client
var client = new pg.Client(conString);
//and connect to a client
client.connect();

//async function that inserts a creator to the database
async function insertCreator(creator) {
  console.log(creator);

  return await client.query(`INSERT INTO creators (name,profileurl) VALUES ('${creator.name}','${creator.profileUrl}') RETURNING creator_id`);
  
}

//async function that inserts an article to the database
async function insertArticle(article) {

  return await client.query(`INSERT INTO articles (article_id,title,thumbnail,creator_id,createdat) VALUES ('${article.article_id}','${article.title}','${article.thumbnail}','${article.creator_id}','${article.createdAt}')`);
      
}

const requestHandler = async (req, res) => {
  
    //We parse the output of the sync file reading
    var data = JSON.parse(fs.readFileSync('prezis.json'));

    //so we can iterate the data , in order to have an await inside it
    for (let value of data) {

        //Setting up a 'creator' object
        var creator = {
            name: value.creator.name,
            profileUrl: value.creator.profileUrl
        }

        try {
            //returns a promise that has the returned id ,otherwise an error
            var creator_result = await insertCreator(creator)
            var creator_id = creator_result.rows[0].creator_id;

        }catch(e){
            res.end({
                error : new Error(e)
            });        
        }

        //Checking if creator_id exists
        if(creator_id){
            //Setting up an 'article' object
            var article = {
                article_id: value.id,
                title: value.title,
                thumbnail: value.thumbnail,
                creator_id: creator_id,
                createdAt:  new Date(value.createdAt).getTime() //We transform the date to timestamp
            };


            try {
                //returns a promise that confirms that the article's insertion is fulfilled ,otherwise an error
                await insertArticle(article)

            }catch(e){
                res.end({
                    error : new Error(e)
                });
            }
            
            res.end('Insertion Successful');
        }      
        
    }
}

const server = http.createServer(requestHandler)

server.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})