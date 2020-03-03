#!groovy
pipeline 
{

    //execute this Pipeline, or stage, on any available agent.
    agent any

    //specifying global execution timeout of one hour, after which Jenkins will abort the Pipeline run.
    options 
    {
        timeout(time: 1, unit: 'HOURS')
    }

    //specifying variables for all stages
    environment 
    {
        //project vars
        PROJECT_SCRATCH_PATH = "./config/project-scratch-def.json"
        SCRATCH_ORG_NAME     = "diag2_ci_test"
        PERMISSION_SET       = "confroom"
        CC_4_6_ID            = "04t0V000001Dyaf"
        USER_NAME            = "abhishek.rapatwar2fa@gmail.com"

        //Jenkins env vars
        SERIAL = System.currentTimeMillis()
        BRANCH = env.BRANCH_NAME.replaceAll(/[\/\\]/, "")

        //SFDX vars
        def toolbelt = tool 'toolbelt'
        SFDX_USE_GENERIC_UNIX_KEYCHAIN = true
        HUB_ORG                        = "abhishek.rapatwar2fa@gmail.com"
        SFDC_HOST                      = "https://login.salesforce.com"
        JWT_KEY_CRED_ID                = "3408fd2d-b6e0-4176-8eca-c36c963947de"
        JWT_KEY_FILE                   = "server.key"
        CONNECTED_APP_CONSUMER_KEY     = "3MVG9n_HvETGhr3B8GsMCqNbCew5qDUJcRlSBye2ngonA6s5hLzInlzV1zArSYxsXPgmJO2HApaIrFvF7sxY7"
    }

    stages 
    {

        stage("Checkout source") 
        {
            steps 
            {
                checkout scm
            }
        }

        stage("Run build") 
        {
            steps 
            {
                withCredentials([file(credentialsId: JWT_KEY_CRED_ID, variable: "JWT_KEY_FILE")]) 
                {

                    script 
                    {
                        echo "on branch name: ${BRANCH}"
                        echo "1. DEV HUB auth"
                        def authStatus = sh returnStatus: true, script: "${toolbelt}/sfdx force:auth:jwt:grant -i ${CONNECTED_APP_CONSUMER_KEY} -u ${HUB_ORG} -f ${JWT_KEY_FILE} -s -r ${SFDC_HOST} --json --loglevel debug"
                        if (authStatus != 0) 
                        {
                            error "DEV HUB authorization failed"
                        } 
                        else 
                        {
                            echo "Successfully authorized to DEV HUB ${HUB_ORG}"
                        }

                        echo "2. Creating Scratch Org"
                        def orgStatus = sh returnStdout: true, script: "${toolbelt}/sfdx force:org:create -s -f ${PROJECT_SCRATCH_PATH} -v ${HUB_ORG} -a ${SCRATCH_ORG_NAME} -d 1"
                        if (!orgStatus.contains("Successfully created scratch org")) 
                        {
                            error "Scratch Org creation failed"
                        } 
                        else
                        {
                            echo orgStatus
                        }

                        echo "3. Installing CC 4.6 package"
                        def packageResult = sh returnStdout: true, script: "${toolbelt}/sfdx force:package:install -p ${CC_4_6_ID} -r -w 100 -u ${SCRATCH_ORG_NAME}"
                        echo packageResult

                        echo "4. Pushing changes to Scratch Org"
                        def pushResult = sh returnStatus: true, script: "${toolbelt}/sfdx force:source:push -u ${SCRATCH_ORG_NAME} -f"
                        if (pushResult != 0) 
                        {
                            error "Push failed"
                        } 
                        else 
                        {
                            echo "Metadata successfully pushed to the Org ${SCRATCH_ORG_NAME}"
                        }

                        def permissionResult = sh returnStatus: true, script: "${toolbelt}/sfdx force:user:permset:assign -n ${PERMISSION_SET} -u ${SCRATCH_ORG_NAME}"
                        if (permissionResult != 0) 
                        {
                            error "Permission Set Assignment failed"
                        } 
                        else 
                        {
                            echo "Successfully assigned ${PERMISSION_SET}"
                        }

                        echo "5. Importing data to Scratch Org"
                        def moduleImportStatus = sh returnStatus: true, script: "${toolbelt}/sfdx force:data:tree:import -f ./data/Module__c.json"
                        if (moduleImportStatus != 0) 
                        {
                            error "Module__c records import failed"
                        } 
                        else
                        {
                            echo "Successfully imported Module__c records"
                        }

                        def orderImportStatus = sh returnStatus: true, script: "${toolbelt}/sfdx force:data:tree:import --plan ./data/order-data/order-data-plan.json"
                        if (orderImportStatus != 0) 
                        {
                            error "ccrz__E_Order__c records import failed"
                        } 
                        else 
                        {
                            echo "Successfully imported ccrz__E_Order__c records"
                        }

                        def addUserRoleStatus = sh returnStatus: true, script: "${toolbelt}/sfdx force:apex:execute -f ./scripts/addUserRole.apex"
                        if (addUserRoleStatus != 0) 
                        {
                            error "addUserRole.apex script failed"
                        } 
                        else 
                        {
                            echo "Successfully update user via addUserRole.apex script"
                        }

                        def faqImportStatus = sh returnStatus: true, script: "${toolbelt}/sfdx force:data:tree:import -f ./data/FAQ__kav.json"
                        if (faqImportStatus != 0) {
                            error "FAQ__kav records import failed"
                        }
                        else
                        {
                            echo "Successfully imported FAQ__kav records"
                        }

                        def generateDataStatus = sh returnStatus: true, script: "${toolbelt}/sfdx force:apex:execute -f ./scripts/generateData.apex"
                        if (generateDataStatus != 0) {
                            error "generateData.apex script failed"
                        } 
                        else 
                        {
                            echo "Successfully update user via generateData.apex script"
                        }

                        echo "6. Running all tests"
                        sh "mkdir -p tests/${SCRATCH_ORG_NAME}"
                        timeout(time: 10, unit: "MINUTES") 
                        {
                            def testsResult = sh returnStatus: true, script: "${toolbelt}/sfdx force:apex:test:run -l RunLocalTests -d tests/${SCRATCH_ORG_NAME} -r tap -u ${SCRATCH_ORG_NAME}"
                            if (testsResult != 0) 
                            {
                                error "Apex tests run failed"
                            } 
                            else 
                            {
                                echo "Apex tests successfully run"
                            }
                        }

                        echo "7. Collecting tests result"
                        junit keepLongStdio: true, testResults: "tests/**/*-junit.xml"

                        echo "8. Clean up"
                        def deleteResult = sh returnStdout: true, script: "${toolbelt}/sfdx force:org:delete -u ${SCRATCH_ORG_NAME} -p"
                        echo "Delete Org status " + deleteResult
                    }

                }
            }
        }
    }
}    
