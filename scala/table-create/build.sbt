lazy val root = (project in file(".")).
  settings(
    name := "table-create",
    version := "0.7",
    scalaVersion := "2.11.7",
    scalacOptions ++= Seq("-deprecation", "-feature"),
    libraryDependencies += "com.github.angiolep" % "akka-wamp_2.11" % "0.12.0"
  )
