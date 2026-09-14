import { container, IAbstractPlugin, type AbstractModule } from "@pimcore/studio-ui-bundle";
import { serviceIds } from "@pimcore/studio-ui-bundle/app";
import { type MainNavRegistry } from "@pimcore/studio-ui-bundle/modules/app";
import { type WidgetRegistry } from "@pimcore/studio-ui-bundle/modules/widget-manager";
import { ExpressionTesterWidget } from "../components/ExpressionTesterWidget";
import { getCurrentUser } from "@pimcore/studio-ui-bundle/modules/auth";

export const ExpressionTesterPlugin: IAbstractPlugin = {
    name: "ExpressionTesterPlugin",

    onStartup({ moduleSystem }) {
        moduleSystem.registerModule(ExpressionTesterModule);
    },
};

const ExpressionTesterModule: AbstractModule = {
    onInit: (): void => {
        const mainNavRegistry = container.get<MainNavRegistry>(serviceIds.mainNavRegistry);

        mainNavRegistry.registerMainNavItem({
            path: "Tools",
            icon: "settings",
            order: 750,
        });

        mainNavRegistry.registerMainNavItem({
            path: "Tools/Expression Tester",
            icon: "calculator",
            widgetConfig: {
                name: "Expression Tester",
                id: "expression-tester",
                component: "action-expression-tester",
                config: {
                    icon: { type: "name", value: "calculator" },
                },
            },
            hidden: () => !getCurrentUser()?.isAdmin,
        });

        const widgetRegistry = container.get<WidgetRegistry>(serviceIds.widgetManager);
        widgetRegistry.registerWidget({
            name: "action-expression-tester",
            component: ExpressionTesterWidget,
        });
    },
};
