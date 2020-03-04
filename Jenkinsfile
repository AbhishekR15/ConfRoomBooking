#!groovy
import groovy.json.JsonSlurperClassic
node 
{

    def BUILD_NUMBER=env.BUILD_NUMBER
    def RUN_ARTIFACT_DIR="tests/${BUILD_NUMBER}"
    def SFDC_USERNAME

    def HUB_ORG=env.HUB_ORG_DH
    def SFDC_HOST = env.SFDC_HOST_DH
    def JWT_KEY_CRED_ID = env.JWT_CRED_ID_DH
    def CONNECTED_APP_CONSUMER_KEY=env.CONNECTED_APP_CONSUMER_KEY_DH
    def JWT_SERVER_KEY = env.SERVER_KEY
    
    println 'KEY IS' 
    println JWT_KEY_CRED_ID
    println HUB_ORG
    println SFDC_HOST
    println CONNECTED_APP_CONSUMER_KEY
    println JWT_SERVER_KEY

    def toolbelt = tool 'toolbelt'

    stage('checkout source') 
    {
        // when running in multi-branch job, one must issue this command
        checkout scm
    }
    
    withCredentials([file(credentialsId: JWT_KEY_CRED_ID, variable: 'jwt_key_file')]) 
    {
         stage('Create Scratch Org') 
        {
            if (isUnix())
            {
                rc = sh returnStatus: true, script: "${toolbelt} force:auth:jwt:grant --clientid ${CONNECTED_APP_CONSUMER_KEY} --username ${HUB_ORG} --jwtkeyfile ${jwt_key_file} --setdefaultdevhubusername --instanceurl ${SFDC_HOST}"
            }
            else
            {
                rc = bat returnStatus: true, script: "\"${toolbelt}\" force:auth:jwt:grant --clientid ${CONNECTED_APP_CONSUMER_KEY} --username ${HUB_ORG} --jwtkeyfile \"${jwt_key_file}\" --setdefaultdevhubusername --instanceurl ${SFDC_HOST}"    
            }

            if (rc != 0) { error 'hub org authorization failed' }

            // need to pull out assigned username
            if (isUnix()) 
            {
rmsg = sh returnStdout: true, script: "${toolbelt} force:org:create --definitionfile config/project-scratch-def.json --json --setdefaultusername"
            }
            else 
            {
rmsg = bat returnStdout: true, script: "\"${toolbelt}\" force:org:create --definitionfile config/project-scratch-def.json --json --setdefaultusername"
            }

            printf rmsg
            println(rmsg)
            def beginIndex = rmsg.indexOf('{')
            def endIndex = rmsg.indexOf('}')
            println(beginIndex)
            println(endIndex)
            def jsobSubstring = rmsg.substring(beginIndex)
            println(jsobSubstring)

            def jsonSlurper = new JsonSlurperClassic()
            def robj = jsonSlurper.parseText(rmsg)
            //if (robj.status != 0) { error 'org creation failed: ' + robj.message }
            SFDC_USERNAME=robj.result.username
            robj = null
        }
        
         stage('Push To Test Org') 
        {
            if (isUnix()) 
            {  rc = sh returnStatus: true, script: "\"${toolbelt}\" force:source:push --targetusername ${SFDC_USERNAME}" }
            else
            {  rc = bat returnStatus: true, script: "\"${toolbelt}\" force:source:push --targetusername ${SFDC_USERNAME}" } 
            
            if (rc != 0) 
                { error 'push failed'}
            
        }
       

        stage('Display scratch org') 
        {
            if (isUnix()) 
            {  rc = sh returnStatus: true, script: "\"${toolbelt}\" force:user:display --targetusername ${SFDC_USERNAME}" }
            else
            { rc = bat returnStatus: true, script: "\"${toolbelt}\" force:source:push --targetusername ${SFDC_USERNAME}" }

            if (rc != 0) 
                { error 'Scratch org display failed'}

            
        }

        stage('collect results') 
        {
            junit keepLongStdio: true, testResults: 'tests/**/*-junit.xml'
        }
    }    
}
