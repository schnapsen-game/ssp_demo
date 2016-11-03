import scala.collection.mutable.{ListBuffer, Map}
import scala.concurrent.duration._
import akka.wamp.client._

import scala.concurrent.Future
import scala.util.{Failure, Success}

package tableCreate {

  class User(name: String, isInvited: Boolean, isJoined: Boolean){
  }

  class Table(users: ListBuffer[User], id:String) {
    def addUser(userName:String) {
      if (!(users contains userName)) {
        users += new User(userName, true, true)
        true
      } else {
        false
      }
    }
  }

  package object TableCreate {
    val client = Client()
    implicit val ec = client.executionContext
    var tableId = 0
    val tables = scala.collection.mutable.Map[String,tableCreate.Table]()

    def generateTableId() = {
      tableId = tableId + 1
      "table" + tableId.toString
    }


    def createTable(userName: String, session: Session){
      val isLoggedIn = session.call(
        procedure = "user:isLoggedIn",
        args = List(userName)
      )

      isLoggedIn.onComplete {
        case Success(value) => {
          if (value != true) {
            println("User not logged in")
          } else {
            val id = generateTableId()
            val table = new Table(ListBuffer(), id)
            table.addUser(userName)
            tables += (id -> table)
            println("Table created from scala. Id: " + id + ", username: " + userName)
            session.publish(
              topic = "local:updateTableList",
              ack = true,
              kwdata = tables.toMap)
          }
        }
      }
    }

    def main(args: Array[String]): Unit = {

      for {
        session <- client.openSession(
          url = "ws://127.0.0.1:8080/ws",
          realm = "ssp-game")

        registration <- session.register(
          procedure = "local:create",
          handler = (userName:String) => createTable(userName, session))
      }
      yield ()
    }
  }
}
