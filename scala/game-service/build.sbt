enablePlugins(DockerPlugin)

lazy val root = (project in file(".")).
  settings(
    name := "gameService",
    version := "0.1",
    scalaVersion := "2.11.6",
    scalacOptions ++= Seq("-deprecation", "-feature"),

    dockerfile in docker := {
    val artifact: File = assembly.value
    val artifactTargetPath = s"/app/${artifact.name}"

    new Dockerfile {
      from("java")
      add(artifact, artifactTargetPath)
      entryPoint("java", "-jar", artifactTargetPath)
    }
  }
  )
