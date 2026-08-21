import MessageBox from "sap/m/MessageBox";
import Core from "sap/ui/core/Core";
import ControllerExtension from "sap/ui/core/mvc/ControllerExtension";
import Message from "sap/ui/core/message/Message";

const WELCOME_EMAIL_SENT_CODE = "WELCOME_EMAIL_SENT";

/**
 * @namespace spacefarers.ext.controller
 */
export default class WelcomeEmailDialog extends ControllerExtension {
    override = {
        editFlow: {
            onAfterSave: async (): Promise<void> => {
                const messageManager = Core.getMessageManager();
                const welcomeMessage = (messageManager.getMessageModel().getData() as Message[])
                    .find((message) => message.getCode() === WELCOME_EMAIL_SENT_CODE);

                if (!welcomeMessage) {
                    return;
                }

                messageManager.removeMessages(welcomeMessage);
                MessageBox.success(welcomeMessage.getMessage(), {
                    title: "Welcome email sent"
                });
            }
        }
    };
}
