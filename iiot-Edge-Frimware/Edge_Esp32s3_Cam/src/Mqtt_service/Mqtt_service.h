#include "global_variables.h"
#include "./Helper/helper.h"
#include "./Secret/secret.h"

using namespace Helper;
using namespace Secret;

class Mqtt_service {   
    private: 
        WiFiClient espClient;

        String userMqtt;
        String passMqtt;

        String topic_pub_status;
        String topic_sub_private;
        String topic_sub_CAM_broadcats;
        String topic_sub_CMD_broadcats;

        String clientId ;

        int port = Secret::portServer;
        const char* HostServer = Secret::serverMqtt;
    public:
        PubSubClient client{espClient};

        Mqtt_service ();
        void setupMqtt(
            String user, 
            String pass, 
            
            String topic_pub_status, 
            String topic_sub_private,
            String topic_sub_CAM_broadcats,
            String topic_sub_CMD_broadcats
            // int port
            // const char* server = HostServer
        );
        bool connectMqtt();
        void reconnect(OLED* oled = nullptr);
        void publishStatus(String message ,bool ratain = false);
        // void publishEPC(String message);

};