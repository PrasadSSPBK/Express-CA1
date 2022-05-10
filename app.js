const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json);
const databasePath = path.join(__dirname, "todoApplication.db");
let database;

const format = require("date-fns/format");
const isValid = require("date-fns/isValid");

const intializerDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

intializerDbAndServer();
const convertTodoTabel = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};
const statusArray = ["TO DO", "IN PROGRESS", "DONE"];
const validStatus = (status) => {
  return validStatus;
};

const priorityArray = ["HIGH", "MEDIUM", "LOW"];
const validPriority = (priority) => {
  return validPriority;
};

const categoryArray = ["WORK", "HOME", "LEARNING"];
const validCategory = (category) => {
  return validCategory;
};

const validDate = (dateObj) => {
  return isValid(new Date(dateObj));
};

const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityAndCategory = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  );
};

const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

//API 1
app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status, category, dueDate } = request.query;
  let dataB = null;
  let getQuery = "";
  //   if (validDate(dueDate) === true) {
  //     const date = new Date(dueDate);
  //     const formatedDate = format(date, "yyyy-MM-dd");
  switch (true) {
    case hasStatus(request.query):
      getQuery = `select* from todo
            WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`;
      break;
    case hasPriority(request.query):
      getQuery = `select* from todo
            WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`;
      break;
    case hasPriorityAndStatus(request.query):
      getQuery = `select* from todo
            WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
      break;
    case hasCategoryAndStatus(request.query):
      getQuery = `select* from todo
            WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND category = '${category}';`;
      break;
    case hasPriorityAndCategory(request.query):
      getQuery = `select* from todo
            WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}''
        AND category = '${category}';`;
      break;
    case hasCategory(request.query):
      getQuery = `select* from todo
            WHERE
        todo LIKE '%${search_q}%'
             AND category = '${category}';`;
      break;

    default:
      getQuery = `select* from todo
            WHERE
        todo LIKE '%${search_q}%';`;
      break;
  }
  dataB = await database.all(getQuery);
  response.send(dataB.map((each) => convertTodoTabel(each)));
  //   } else {
  //     response.status(400);
  //     response.send("Invalid Due Date");
  //   }
});

//API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const gettodoIDQuery = `select* from todo WHERE id=${todoId};`;
  const todoIdArray = await database.get(gettodoIDQuery);
  response.send(convertTodoTabel(todoIdArray));
});

//API 3

app.get("/agenda/", async (request, response) => {
  const { search_q = "", dueDate } = request.query;
  const formatedDate = format(new Date(dueDate), "yyyy-MM-dd");
  const getDateQuery = `select * from todo WHERE
        todo LIKE '%${search_q}% and due_date=${formatedDate};`;
  const result = await database.get(getDateQuery);
  response.send(convertTodoTabel(result));
});

//API 4

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const formatedDate = format(new Date(dueDate), "yyyy-MM-dd");
  if (validDate(formatedDate) === true) {
    const postQuery = `INSERT into todo
        (id,todo,priority,status,category,due_date)
        values
        (${id},'${todo}','${priority}','${status}','${category}',${formatedDate});`;
    const postData = await database.run(postQuery);
    response.send("Todo Successfully Added");
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API 5

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "category";
      break;
    case requestBody.due_date !== undefined:
      updateColumn = "dueDate";
      break;
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodoQuery.due_date,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}'
      category='${category}'
      due_date='${dueDate}'
    WHERE
      id = ${todoId};`;

  await database.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
